<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HeroSlideShowcaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $slides = [
            [
                'sort_order' => 1,
                'eyebrow' => 'Prescription-aware ordering',
                'eyebrow_bn' => 'প্রেসক্রিপশনসহ নিরাপদ অর্ডার',
                'title' => 'Your trusted online pharmacy for daily and prescription care.',
                'title_bn' => 'দৈনন্দিন ও প্রেসক্রিপশন কেয়ারের জন্য আপনার বিশ্বস্ত অনলাইন ফার্মেসি।',
                'primary_label' => 'Shop products',
                'primary_label_bn' => 'পণ্য দেখুন',
                'primary_url' => '/products',
                'secondary_label' => 'Upload prescription',
                'secondary_label_bn' => 'প্রেসক্রিপশন আপলোড করুন',
                'secondary_url' => '/upload-prescription',
                'image_url' => 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1800&q=80',
                'status' => 'active',
            ],
            [
                'sort_order' => 2,
                'eyebrow' => 'OTC to Rx in one place',
                'eyebrow_bn' => 'ওটিসি থেকে আরএক্স, সব এক জায়গায়',
                'title' => 'Browse medicines, upload prescriptions, and order with confidence.',
                'title_bn' => 'ওষুধ ব্রাউজ করুন, প্রেসক্রিপশন আপলোড করুন, আর নিশ্চিন্তে অর্ডার করুন।',
                'primary_label' => 'Explore medicines',
                'primary_label_bn' => 'ওষুধ দেখুন',
                'primary_url' => '/products?type=medicine',
                'secondary_label' => 'Upload prescription',
                'secondary_label_bn' => 'প্রেসক্রিপশন আপলোড',
                'secondary_url' => '/upload-prescription',
                'image_url' => 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1800&q=80',
                'status' => 'active',
            ],
            [
                'sort_order' => 3,
                'eyebrow' => 'Care beyond medicines',
                'eyebrow_bn' => 'ওষুধের বাইরেও প্রয়োজনীয় সবকিছু',
                'title' => 'Pads, bandages, saline, devices, and health essentials in one storefront.',
                'title_bn' => 'প্যাড, ব্যান্ডেজ, স্যালাইন, ডিভাইস ও স্বাস্থ্যপণ্য এখন এক storefront-এ।',
                'primary_label' => 'Browse essentials',
                'primary_label_bn' => 'এসেনশিয়ালস দেখুন',
                'primary_url' => '/products?type=other',
                'secondary_label' => 'See all products',
                'secondary_label_bn' => 'সব পণ্য দেখুন',
                'secondary_url' => '/products',
                'image_url' => 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1800&q=80',
                'status' => 'active',
            ],
            [
                'sort_order' => 4,
                'eyebrow' => 'Family health support',
                'eyebrow_bn' => 'পুরো পরিবারের স্বাস্থ্য সাপোর্ট',
                'title' => 'Child care, women’s health, and home health support arranged category-wise.',
                'title_bn' => 'শিশুদের যত্ন, নারীর স্বাস্থ্য ও হোম হেলথ সাপোর্ট এখন ক্যাটাগরি অনুযায়ী সাজানো।',
                'primary_label' => 'Shop by category',
                'primary_label_bn' => 'ক্যাটাগরি দেখুন',
                'primary_url' => '/products',
                'secondary_label' => 'Track order',
                'secondary_label_bn' => 'অর্ডার ট্র্যাক করুন',
                'secondary_url' => '/track-order',
                'image_url' => 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1800&q=80',
                'status' => 'active',
            ],
            [
                'sort_order' => 5,
                'eyebrow' => 'Fast pharmacy workflow',
                'eyebrow_bn' => 'দ্রুত ফার্মেসি workflow',
                'title' => 'Search, compare, and place your order with clean pharmacy-ready navigation.',
                'title_bn' => 'সহজ pharmacy-ready navigation দিয়ে সার্চ করুন, তুলনা করুন, আর অর্ডার দিন।',
                'primary_label' => 'Start shopping',
                'primary_label_bn' => 'শপিং শুরু করুন',
                'primary_url' => '/products',
                'secondary_label' => 'Need support?',
                'secondary_label_bn' => 'সাপোর্ট লাগবে?',
                'secondary_url' => '/support',
                'image_url' => 'https://images.unsplash.com/photo-1485841890310-6a055c88698a?auto=format&fit=crop&w=1800&q=80',
                'status' => 'active',
            ],
            [
                'sort_order' => 6,
                'eyebrow' => 'Dhaka delivery coverage',
                'eyebrow_bn' => 'ঢাকা জুড়ে ডেলিভারি',
                'title' => 'From prescription review to doorstep delivery, everything stays in one flow.',
                'title_bn' => 'প্রেসক্রিপশন রিভিউ থেকে বাসায় ডেলিভারি, সবকিছুই থাকে এক flow-এ।',
                'primary_label' => 'Order now',
                'primary_label_bn' => 'অর্ডার করুন',
                'primary_url' => '/products',
                'secondary_label' => 'My orders',
                'secondary_label_bn' => 'আমার অর্ডার',
                'secondary_url' => '/orders',
                'image_url' => 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1800&q=80',
                'status' => 'active',
            ],
        ];

        foreach ($slides as $slide) {
            DB::table('hero_slides')->updateOrInsert(
                ['sort_order' => $slide['sort_order']],
                $slide + [
                    'created_at' => $now,
                    'updated_at' => $now,
                    'image_path' => null,
                ],
            );
        }
    }
}
