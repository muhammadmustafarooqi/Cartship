import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const INITIAL_CATEGORIES = [
  {
    name: "Kitchen & Cooking",
    slug: "kitchen-cooking",
    icon: "ChefHat",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200",
    imagePosition: "center 60%",
    tagline: "Cookware, prep tools & smart kitchen picks",
    isFeatured: true,
    order: 0,
    isActive: true,
    showName: true,
    showIcon: true,
    showExploreBtn: true,
  },
  {
    name: "Personal Care & Beauty",
    slug: "personal-care-beauty",
    icon: "Sparkles",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=700",
    imagePosition: "center 42%",
    tagline: "Skincare, hair care & grooming",
    isFeatured: false,
    order: 1,
    isActive: true,
    showName: true,
    showIcon: true,
    showExploreBtn: true,
  },
  {
    name: "Home & Cleaning",
    slug: "home-cleaning",
    icon: "Home",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=700",
    imagePosition: "center 55%",
    tagline: "Home organizers & cleaning essentials",
    isFeatured: false,
    order: 2,
    isActive: true,
    showName: true,
    showIcon: true,
    showExploreBtn: true,
  },
  {
    name: "Fitness & Health",
    slug: "fitness-health",
    icon: "Dumbbell",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=700",
    imagePosition: "center 45%",
    tagline: "Workout accessories & wellness gear",
    isFeatured: false,
    order: 3,
    isActive: true,
    showName: true,
    showIcon: true,
    showExploreBtn: true,
  },
  {
    name: "Electronics & Gadgets",
    slug: "electronics-gadgets",
    icon: "Zap",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=700",
    imagePosition: "center 50%",
    tagline: "Smart gadgets & home electronics",
    isFeatured: false,
    order: 4,
    isActive: true,
    showName: true,
    showIcon: true,
    showExploreBtn: true,
  },
  {
    name: "Baby & Kids",
    slug: "baby-kids",
    icon: "Baby",
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=900",
    imagePosition: "center 48%",
    tagline: "Toys, care products & kids items",
    isFeatured: false,
    order: 5,
    isActive: true,
    showName: true,
    showIcon: true,
    showExploreBtn: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(INITIAL_CATEGORIES);
    }

    const query = includeInactive ? {} : { isActive: true };
    const categories = await Category.find(query).sort({ order: 1, createdAt: -1 }).lean();
    
    return NextResponse.json({ categories }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const category = await Category.create(body);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Categories POST error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

