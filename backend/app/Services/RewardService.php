<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\RewardTransaction;
use App\Models\SiteSetting;
use App\Models\User;
use App\Support\Currency;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RewardService
{
    public function __construct(
        private NotificationService $notifications,
    ) {}

    public function isEnabled(): bool
    {
        return (bool) SiteSetting::singleton()->rewards_enabled;
    }

    public function claimOptions(): array
    {
        return [
            [
                'id' => 'starter-50',
                'title' => 'Tk 50 reward coupon',
                'title_bn' => '৫০ টাকার রিওয়ার্ড কুপন',
                'points_cost' => 25,
                'coupon_type' => 'fixed',
                'coupon_amount' => 50,
                'min_subtotal' => 500,
                'expires_in_days' => 21,
            ],
            [
                'id' => 'saver-120',
                'title' => 'Tk 130 reward coupon',
                'title_bn' => '১৩০ টাকার রিওয়ার্ড কুপন',
                'points_cost' => 60,
                'coupon_type' => 'fixed',
                'coupon_amount' => 130,
                'min_subtotal' => 1200,
                'expires_in_days' => 21,
            ],
            [
                'id' => 'plus-220',
                'title' => 'Tk 250 reward coupon',
                'title_bn' => '২৫০ টাকার রিওয়ার্ড কুপন',
                'points_cost' => 110,
                'coupon_type' => 'fixed',
                'coupon_amount' => 250,
                'min_subtotal' => 2000,
                'expires_in_days' => 30,
            ],
        ];
    }

    public function syncDeliveredOrders(User $user): void
    {
        if (! $this->isEnabled()) {
            return;
        }

        $orders = Order::query()
            ->where('user_id', $user->id)
            ->where('order_status', 'delivered')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('reward_transactions')
                    ->whereColumn('reward_transactions.order_id', 'orders.id')
                    ->where('reward_transactions.type', 'earned');
            })
            ->get();

        foreach ($orders as $order) {
            $this->awardOrderPoints($order);
        }
    }

    public function awardOrderPoints(Order $order): ?RewardTransaction
    {
        if (! $this->isEnabled() || ! $order->user_id) {
            return null;
        }

        $existing = RewardTransaction::query()
            ->where('type', 'earned')
            ->where('order_id', $order->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        $points = $this->pointsFromOrder($order);

        if ($points <= 0) {
            return null;
        }

        return RewardTransaction::create([
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'type' => 'earned',
            'points' => $points,
            'title' => 'Reward points earned',
            'title_bn' => 'রিওয়ার্ড পয়েন্ট অর্জিত হয়েছে',
            'description' => "You earned {$points} reward points from order {$order->order_number}.",
            'description_bn' => "অর্ডার {$order->order_number} থেকে আপনি {$points} রিওয়ার্ড পয়েন্ট অর্জন করেছেন।",
            'metadata' => [
                'order_number' => $order->order_number,
                'rewardable_amount' => $this->rewardableAmount($order),
            ],
        ]);
    }

    public function reverseOrderPoints(Order $order): ?RewardTransaction
    {
        if (! $order->user_id) {
            return null;
        }

        $earned = RewardTransaction::query()
            ->where('type', 'earned')
            ->where('order_id', $order->id)
            ->first();

        if (! $earned) {
            return null;
        }

        $existing = RewardTransaction::query()
            ->where('type', 'reversed')
            ->where('order_id', $order->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        return RewardTransaction::create([
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'type' => 'reversed',
            'points' => $earned->points,
            'title' => 'Reward points reversed',
            'title_bn' => 'রিওয়ার্ড পয়েন্ট সমন্বয় করা হয়েছে',
            'description' => "Reward points from order {$order->order_number} were reversed.",
            'description_bn' => "অর্ডার {$order->order_number}-এর রিওয়ার্ড পয়েন্ট সমন্বয় করা হয়েছে।",
            'metadata' => [
                'order_number' => $order->order_number,
                'source_transaction_id' => $earned->id,
            ],
        ]);
    }

    public function claim(User $user, string $optionId): array
    {
        if (! $this->isEnabled()) {
            throw ValidationException::withMessages([
                'rewards' => 'Rewards are currently unavailable.',
            ]);
        }

        $option = collect($this->claimOptions())->firstWhere('id', $optionId);

        if (! $option) {
            throw ValidationException::withMessages([
                'option_id' => 'The selected reward option is invalid.',
            ]);
        }

        return DB::transaction(function () use ($user, $option) {
            $summary = $this->summaryForUser($user);
            $availablePoints = (int) ($summary['available_points'] ?? 0);
            $cost = (int) $option['points_cost'];

            if ($availablePoints < $cost) {
                throw ValidationException::withMessages([
                    'option_id' => 'You do not have enough reward points for this claim.',
                ]);
            }

            $coupon = Coupon::create([
                'user_id' => $user->id,
                'code' => $this->generateCouponCode(),
                'label' => $option['title'],
                'label_bn' => $option['title_bn'],
                'type' => $option['coupon_type'],
                'amount' => $option['coupon_amount'],
                'min_subtotal' => $option['min_subtotal'],
                'usage_limit' => 1,
                'used_count' => 0,
                'source' => 'reward',
                'reward_points_cost' => $cost,
                'starts_at' => now(),
                'ends_at' => now()->addDays((int) $option['expires_in_days']),
                'status' => 'active',
            ]);

            $transaction = RewardTransaction::create([
                'user_id' => $user->id,
                'coupon_id' => $coupon->id,
                'type' => 'claimed',
                'points' => $cost,
                'title' => 'Reward coupon claimed',
                'title_bn' => 'রিওয়ার্ড কুপন ক্লেইম করা হয়েছে',
                'description' => "You claimed coupon {$coupon->code} using {$cost} points.",
                'description_bn' => "{$cost} পয়েন্ট ব্যবহার করে আপনি {$coupon->code} কুপন ক্লেইম করেছেন।",
                'metadata' => [
                    'coupon_code' => $coupon->code,
                    'coupon_amount' => Currency::whole($coupon->amount),
                ],
            ]);

            $this->notifications->create([
                'user_id' => $user->id,
                'notification_type' => 'reward_claimed',
                'title' => 'Reward coupon ready',
                'message' => "Your reward coupon {$coupon->code} is now ready to use.",
                'metadata' => [
                    'resource' => 'rewards',
                    'resource_id' => $transaction->id,
                    'link' => '/rewards',
                    'coupon_code' => $coupon->code,
                ],
            ]);

            return [
                'transaction' => $transaction->load('coupon'),
                'coupon' => $this->couponPayload($coupon),
            ];
        });
    }

    public function summaryForUser(User $user): array
    {
        if (! $this->isEnabled()) {
            return [
                'enabled' => false,
                'available_points' => 0,
                'lifetime_earned_points' => 0,
                'claimed_points' => 0,
                'reversed_points' => 0,
                'delivered_count' => 0,
                'total_spent' => 0,
                'tier' => $this->tierFromPoints(0),
                'progress_percent' => 0,
                'next_gap' => 60,
                'claim_options' => collect($this->claimOptions())->map(fn ($option) => [
                    ...$option,
                    'can_claim' => false,
                ])->values()->all(),
                'latest_delivered' => [],
                'recent_transactions' => [],
                'claimed_coupons' => [],
            ];
        }

        $this->syncDeliveredOrders($user);

        $transactions = RewardTransaction::query()
            ->with(['order:id,order_number,order_date', 'coupon:id,code,used_count,usage_limit,ends_at,status'])
            ->where('user_id', $user->id)
            ->latest('id')
            ->get();

        $earned = (int) $transactions->where('type', 'earned')->sum('points');
        $claimed = (int) $transactions->where('type', 'claimed')->sum('points');
        $reversed = (int) $transactions->where('type', 'reversed')->sum('points');
        $available = max(0, $earned - $claimed - $reversed);
        $tier = $this->tierFromPoints($earned);

        $deliveredOrders = Order::query()
            ->where('user_id', $user->id)
            ->where('order_status', 'delivered')
            ->latest('order_date')
            ->get(['id', 'order_number', 'order_date', 'order_status', 'total_amount']);

        return [
            'enabled' => true,
            'available_points' => $available,
            'lifetime_earned_points' => $earned,
            'claimed_points' => $claimed,
            'reversed_points' => $reversed,
            'delivered_count' => $deliveredOrders->count(),
            'total_spent' => Currency::whole($deliveredOrders->sum('total_amount')),
            'tier' => $tier,
            'progress_percent' => $this->progressPercent($earned, $tier),
            'next_gap' => $tier['next_points'] ? max($tier['next_points'] - $earned, 0) : 0,
            'claim_options' => collect($this->claimOptions())->map(fn ($option) => [
                ...$option,
                'can_claim' => $available >= (int) $option['points_cost'],
            ])->values()->all(),
            'latest_delivered' => $deliveredOrders->take(4)->values()->all(),
            'recent_transactions' => $transactions->take(8)->map(fn (RewardTransaction $transaction) => $this->transactionPayload($transaction))->values()->all(),
            'claimed_coupons' => Coupon::query()
                ->where('user_id', $user->id)
                ->where('source', 'reward')
                ->latest('id')
                ->take(6)
                ->get()
                ->map(fn (Coupon $coupon) => $this->couponPayload($coupon))
                ->values()
                ->all(),
        ];
    }

    private function tierFromPoints(int $points): array
    {
        if ($points >= 110) {
            return [
                'title' => 'Gold member',
                'title_bn' => 'গোল্ড মেম্বার',
                'tone' => 'amber',
                'next_points' => null,
                'floor_points' => 110,
            ];
        }

        if ($points >= 60) {
            return [
                'title' => 'Silver member',
                'title_bn' => 'সিলভার মেম্বার',
                'tone' => 'slate',
                'next_points' => 110,
                'floor_points' => 60,
            ];
        }

        return [
            'title' => 'Starter member',
            'title_bn' => 'স্টার্টার মেম্বার',
            'tone' => 'emerald',
            'next_points' => 60,
            'floor_points' => 0,
        ];
    }

    private function progressPercent(int $points, array $tier): int
    {
        if (! $tier['next_points']) {
            return 100;
        }

        $range = max(1, (int) $tier['next_points'] - (int) $tier['floor_points']);
        $progress = max(0, $points - (int) $tier['floor_points']);

        return min(100, (int) round(($progress / $range) * 100));
    }

    private function transactionPayload(RewardTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'type' => $transaction->type,
            'points' => (int) $transaction->points,
            'title' => $transaction->title,
            'title_bn' => $transaction->title_bn,
            'description' => $transaction->description,
            'description_bn' => $transaction->description_bn,
            'created_at' => optional($transaction->created_at)->toISOString(),
            'order' => $transaction->order ? [
                'id' => $transaction->order->id,
                'order_number' => $transaction->order->order_number,
                'order_date' => optional($transaction->order->order_date)->toISOString(),
            ] : null,
            'coupon' => $transaction->coupon ? $this->couponPayload($transaction->coupon) : null,
        ];
    }

    private function couponPayload(Coupon $coupon): array
    {
        $expired = $coupon->ends_at && $coupon->ends_at->isPast();
        $usedUp = $coupon->usage_limit && $coupon->used_count >= $coupon->usage_limit;

        return [
            'id' => $coupon->id,
            'code' => $coupon->code,
            'label' => $coupon->label,
            'label_bn' => $coupon->label_bn,
            'type' => $coupon->type,
            'amount' => Currency::whole($coupon->amount),
            'min_subtotal' => Currency::whole($coupon->min_subtotal),
            'reward_points_cost' => $coupon->reward_points_cost,
            'status' => $coupon->status,
            'used_count' => (int) $coupon->used_count,
            'usage_limit' => $coupon->usage_limit ? (int) $coupon->usage_limit : null,
            'ends_at' => optional($coupon->ends_at)->toISOString(),
            'redemption_status' => $expired ? 'expired' : ($usedUp ? 'used' : 'available'),
        ];
    }

    private function pointsFromOrder(Order $order): int
    {
        return (int) floor($this->rewardableAmount($order) / 200);
    }

    private function rewardableAmount(Order $order): float
    {
        return Currency::whole(max(0, (float) $order->subtotal_amount - (float) $order->discount_amount));
    }

    private function generateCouponCode(): string
    {
        do {
            $code = 'RW-' . Str::upper(Str::random(8));
        } while (Coupon::query()->where('code', $code)->exists());

        return $code;
    }
}
