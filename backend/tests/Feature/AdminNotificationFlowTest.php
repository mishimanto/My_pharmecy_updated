<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminNotificationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_filter_mark_all_read_and_bulk_archive_delete_notifications(): void
    {
        $staff = $this->actingAsStaff();

        $newOrder = Notification::create([
            'staff_id' => $staff->id,
            'notification_type' => 'new_order',
            'title' => 'New order',
            'message' => 'Order placed',
            'status' => 'unread',
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);

        $support = Notification::create([
            'staff_id' => $staff->id,
            'notification_type' => 'new_support_ticket',
            'title' => 'Support ticket',
            'message' => 'Help needed',
            'status' => 'unread',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson('/api/admin/notifications?notification_type=new_order&date_from='.now()->subDays(2)->toDateString().'&date_to='.now()->toDateString())
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $newOrder->id);

        $this->patchJson('/api/admin/notifications/read-all', ['notification_type' => 'new_order'])
            ->assertOk()
            ->assertJsonPath('data.updated', 1);

        $this->assertDatabaseHas('notifications', [
            'id' => $newOrder->id,
            'status' => 'read',
        ]);
        $this->assertDatabaseHas('notifications', [
            'id' => $support->id,
            'status' => 'unread',
        ]);

        $this->postJson('/api/admin/notifications/bulk', [
            'action' => 'archive',
            'ids' => [$support->id],
        ])->assertOk()->assertJsonPath('data.affected', 1);

        $this->assertDatabaseHas('notifications', [
            'id' => $support->id,
            'status' => 'archived',
        ]);

        $this->postJson('/api/admin/notifications/bulk', [
            'action' => 'delete',
            'ids' => [$newOrder->id],
        ])->assertOk()->assertJsonPath('data.affected', 1);

        $this->assertDatabaseMissing('notifications', ['id' => $newOrder->id]);
    }

    public function test_staff_notification_preferences_hide_disabled_types(): void
    {
        $staff = $this->actingAsStaff();

        Notification::create([
            'staff_id' => $staff->id,
            'notification_type' => 'new_order',
            'title' => 'New order',
            'message' => 'Order placed',
            'status' => 'unread',
        ]);

        Notification::create([
            'staff_id' => $staff->id,
            'notification_type' => 'new_prescription',
            'title' => 'New prescription',
            'message' => 'Prescription uploaded',
            'status' => 'unread',
        ]);

        $this->putJson('/api/admin/notifications/preferences', [
            'disabled_types' => ['new_prescription'],
        ])->assertOk()
            ->assertJsonPath('data.disabled_types.0', 'new_prescription');

        $response = $this->getJson('/api/admin/notifications')->assertOk();
        $types = collect($response->json('data.data'))->pluck('notification_type');

        $this->assertTrue($types->contains('new_order'));
        $this->assertFalse($types->contains('new_prescription'));
    }

    private function actingAsStaff(): Staff
    {
        $staff = Staff::create([
            'full_name' => 'Notification Admin',
            'email' => fake()->unique()->safeEmail(),
            'phone' => '01700000003',
            'password' => 'password123',
            'status' => 'active',
        ]);

        Sanctum::actingAs($staff, ['staff']);

        return $staff;
    }
}
