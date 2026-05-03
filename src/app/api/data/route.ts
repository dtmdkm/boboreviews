import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Store, Deal, Category, BlogPost, EventSale, Setting } from '@/models';

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    await connectToDatabase();
    
    // Fetch all data concurrently
    const [popularStores, deals, categories, blogPosts, eventSales, settingsList] = await Promise.all([
      Store.find({ status: 'active' }),
      Deal.find({}).populate('storeId'),
      Category.find({}),
      BlogPost.find({ status: 'active' }).sort({ createdAt: -1 }).limit(10),
      EventSale.find({ status: 'active' }),
      Setting.find({})
    ]);

    // Map settings to object
    const settings: any = settingsList.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    // Filter deals to only include those from active stores
    const activeStoreIds = new Set(popularStores.map(s => s._id.toString()));
    const activeDeals = deals.filter(deal => {
      const storeId = deal.storeId?._id?.toString() || deal.storeId?.id || deal.storeId?.toString();
      return activeStoreIds.has(storeId);
    });

    // Ensure categories have correct local links
    const mappedCategories = categories.map((cat: any) => ({
      ...cat.toObject(),
      link: `/category/${cat.slug || ''}`
    }));

    return NextResponse.json({
      popularStores,
      deals: activeDeals,
      categories: mappedCategories,
      blogPosts,
      eventSales,
      footer: {
        resources: settings.footer_resources || [],
        company: settings.footer_company || [],
        notices: settings.footer_notices || []
      },
      siteSettings: {
        logo: settings.site_logo || '',
        title: settings.site_title || 'Boboreviews',
        contactEmail: settings.contact_email || ''
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
