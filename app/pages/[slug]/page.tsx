import { Metadata } from "next";
import { notFound } from "next/navigation";
import connectToDatabase from "@/lib/mongodb";
import Page from "@/models/Page";

// Dynamic metadata generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connectToDatabase();
  const page = await Page.findOne({ slug, isActive: true });

  if (!page) {
    return {
      title: "Page Not Found - CartShip",
    };
  }

  return {
    title: `${page.title} - CartShip`,
  };
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectToDatabase();
  const page = await Page.findOne({ slug, isActive: true });

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20">
      <div className="page-container max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 font-outfit tracking-tight">
            {page.title}
          </h1>
          
          <div 
            className="static-page-content"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          <style>{`
            .static-page-content {
              font-family: var(--font-jakarta), sans-serif;
              color: var(--slate, #475569);
              line-height: 1.8;
              font-size: 1.1rem;
            }
            
            .static-page-content h1,
            .static-page-content h2,
            .static-page-content h3,
            .static-page-content h4,
            .static-page-content h5,
            .static-page-content h6 {
              font-family: var(--font-outfit), sans-serif;
              color: var(--navy-deep, #0a192f);
              font-weight: 800;
              margin-top: 2.5rem;
              margin-bottom: 1rem;
              line-height: 1.3;
            }
            
            .static-page-content h1 { font-size: 2.5rem; }
            .static-page-content h2 { font-size: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
            .static-page-content h3 { font-size: 1.5rem; }
            
            .static-page-content p {
              margin-bottom: 1.5rem;
            }
            
            .static-page-content ul,
            .static-page-content ol {
              margin-bottom: 1.5rem;
              padding-left: 1.5rem;
            }
            
            .static-page-content ul { list-style-type: disc; }
            .static-page-content ol { list-style-type: decimal; }
            
            .static-page-content li {
              margin-bottom: 0.5rem;
            }
            
            .static-page-content a {
              color: var(--orange, #f97316);
              text-decoration: none;
              font-weight: 600;
              border-bottom: 2px solid transparent;
              transition: border-color 0.2s;
            }
            
            .static-page-content a:hover {
              border-bottom-color: var(--orange, #f97316);
            }
            
            .static-page-content strong,
            .static-page-content b {
              color: var(--navy, #112240);
              font-weight: 700;
            }
            
            .static-page-content blockquote {
              border-left: 4px solid var(--orange, #f97316);
              padding-left: 1rem;
              margin-left: 0;
              font-style: italic;
              color: #64748b;
              background: #f8fafc;
              padding: 1rem;
              border-radius: 0 0.5rem 0.5rem 0;
            }

            .static-page-content img {
              max-width: 100%;
              height: auto;
              border-radius: 0.5rem;
              margin: 2rem 0;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
