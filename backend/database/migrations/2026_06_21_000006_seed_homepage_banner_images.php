<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('banner_images')) {
            return;
        }

        $banners = [
            [
                'title' => 'Prescription care banner',
                'title_bn' => 'Prescription care banner',
                'label' => 'Prescription support',
                'label_bn' => 'Prescription support',
                'body' => 'Upload prescriptions and order reviewed medicines.',
                'body_bn' => 'Upload prescriptions and order reviewed medicines.',
                'button_label' => 'Upload prescription',
                'button_label_bn' => 'Upload prescription',
                'link_url' => '/upload-prescription',
                'placement' => 'homepage',
                'image_url' => 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=85',
                'sort_order' => 1,
                'status' => 'active',
            ],
            [
                'title' => 'Medicine delivery banner',
                'title_bn' => 'Medicine delivery banner',
                'label' => 'Fast delivery',
                'label_bn' => 'Fast delivery',
                'body' => 'Order essentials and get doorstep delivery.',
                'body_bn' => 'Order essentials and get doorstep delivery.',
                'button_label' => 'Shop medicines',
                'button_label_bn' => 'Shop medicines',
                'link_url' => '/products',
                'placement' => 'homepage',
                'image_url' => 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1600&q=85',
                'sort_order' => 2,
                'status' => 'active',
            ],
            [
                'title' => 'Pharmacy essentials banner',
                'title_bn' => 'Pharmacy essentials banner',
                'label' => 'Health essentials',
                'label_bn' => 'Health essentials',
                'body' => 'Find pharmacy essentials in one place.',
                'body_bn' => 'Find pharmacy essentials in one place.',
                'button_label' => 'Browse products',
                'button_label_bn' => 'Browse products',
                'link_url' => '/products',
                'placement' => 'homepage',
                'image_url' => 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1600&q=85',
                'sort_order' => 3,
                'status' => 'active',
            ],
            [
                'title' => 'Support and review banner',
                'title_bn' => 'Support and review banner',
                'label' => 'Review and support',
                'label_bn' => 'Review and support',
                'body' => 'Get help with orders, prescriptions, and delivery.',
                'body_bn' => 'Get help with orders, prescriptions, and delivery.',
                'button_label' => 'Contact support',
                'button_label_bn' => 'Contact support',
                'link_url' => '/support',
                'placement' => 'homepage',
                'image_url' => 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=1600&q=85',
                'sort_order' => 4,
                'status' => 'active',
            ],
        ];

        foreach ($banners as $banner) {
            $query = DB::table('banner_images')
                ->where('title', $banner['title'])
                ->where('placement', $banner['placement']);

            if ($query->exists()) {
                $query->update([
                    ...$banner,
                    'updated_at' => now(),
                ]);
                continue;
            }

            DB::table('banner_images')->insert([
                ...$banner,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('banner_images')) {
            return;
        }

        DB::table('banner_images')
            ->whereIn('title', [
                'Prescription care banner',
                'Medicine delivery banner',
                'Pharmacy essentials banner',
                'Support and review banner',
            ])
            ->delete();
    }
};
