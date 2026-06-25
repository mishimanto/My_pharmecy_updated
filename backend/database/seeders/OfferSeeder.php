<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OfferSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $offers = [
            [
                'label' => '7 day storewide',
                'label_bn' => '৭ দিনের সাশ্রয়',
                'title' => '10% off on pharmacy products for 7 days',
                'title_bn' => '৭ দিনের জন্য ফার্মেসি পণ্যে ১০% ছাড়',
                'body' => 'A short storewide campaign applied automatically at checkout.',
                'body_bn' => 'স্টোরজুড়ে স্বয়ংক্রিয় ছাড়, চেকআউটে আলাদা কোড লাগবে না।',
                'button_label' => 'Shop now',
                'button_label_bn' => 'এখন কিনুন',
                'link_url' => '/products',
                'image_url' => 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1400&q=80',
                'sort_order' => 1,
                'show_in_nav' => true,
                'discount_type' => 'percent',
                'discount_value' => 10,
                'max_discount' => null,
                'applies_to' => 'all',
                'starts_at' => $now,
                'ends_at' => $now->copy()->addDays(7),
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'label' => 'Gastric care',
                'label_bn' => 'গ্যাস্ট্রিক কেয়ার',
                'title' => '15% off on gastric care products',
                'title_bn' => 'গ্যাস্ট্রিক কেয়ার পণ্যে ১৫% ছাড়',
                'body' => 'Category-based offer for selected health needs.',
                'body_bn' => 'নির্দিষ্ট ক্যাটাগরির পণ্যে স্বয়ংক্রিয় ছাড়।',
                'button_label' => 'Browse gastric care',
                'button_label_bn' => 'গ্যাস্ট্রিক কেয়ার দেখুন',
                'link_url' => '/products',
                'image_url' => 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1400&q=80',
                'sort_order' => 2,
                'show_in_nav' => false,
                'discount_type' => 'percent',
                'discount_value' => 15,
                'max_discount' => 80,
                'applies_to' => 'category',
                'category_id' => DB::table('categories')->where('category_name', 'Gastric Care')->value('id'),
                'starts_at' => $now,
                'ends_at' => $now->copy()->addDays(10),
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'label' => 'Square special',
                'label_bn' => 'স্কয়ার স্পেশাল',
                'title' => 'Save Tk 5 on Square products',
                'title_bn' => 'স্কয়ার পণ্যে ৫ টাকা ছাড়',
                'body' => 'Brand/manufacturer-level offer applied per purchase unit.',
                'body_bn' => 'নির্দিষ্ট ব্র্যান্ড বা ম্যানুফ্যাকচারারের পণ্যে ছাড়।',
                'button_label' => 'Explore products',
                'button_label_bn' => 'পণ্য দেখুন',
                'link_url' => '/products',
                'image_url' => 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1400&q=80',
                'sort_order' => 3,
                'show_in_nav' => false,
                'discount_type' => 'fixed',
                'discount_value' => 5,
                'max_discount' => null,
                'applies_to' => 'manufacturer',
                'manufacturer_id' => DB::table('manufacturers')->where('manufacturer_name', 'Square Pharmaceuticals')->value('id'),
                'starts_at' => $now,
                'ends_at' => $now->copy()->addDays(14),
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($offers as $offer) {
            DB::table('offers')->updateOrInsert(
                ['title' => $offer['title']],
                $offer,
            );
        }
    }
}
