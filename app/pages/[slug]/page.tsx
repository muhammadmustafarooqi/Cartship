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
            /* Force reset all inline styles injected by rich text editors */
            .static-page-content {
              font-family: var(--font-jakarta), sans-serif !important;
              color: var(--slate, #475569) !important;
              line-height: 1.7 !important;
              font-size: 1.05rem !important;
            }
            
            .static-page-content * {
              font-family: inherit !important;
              line-height: inherit !important;
              background-color: transparent !important;
              margin: 0;
              padding: 0;
            }

            /* Hide empty paragraphs that cause massive gaps */
            .static-page-content p:empty,
            .static-page-content p br:only-child {
              display: none !important;
            }
            
            .static-page-content h1,
            .static-page-content h2,
            .static-page-content h3,
            .static-page-content h4,
            .static-page-content h5,
            .static-page-content h6,
            .static-page-content h1 *,
            .static-page-content h2 *,
            .static-page-content h3 *,
            .static-page-content h4 *,
            .static-page-content h5 *,
            .static-page-content h6 * {
              font-family: var(--font-outfit), sans-serif !important;
              color: var(--navy-deep, #0a192f) !important;
              font-weight: 800 !important;
            }

            .static-page-content h1,
            .static-page-content h2,
            .static-page-content h3,
            .static-page-content h4,
            .static-page-content h5,
            .static-page-content h6 {
              margin-top: 1.5rem !important;
              margin-bottom: 0.75rem !important;
              line-height: 1.3 !important;
            }
            
            .static-page-content h1 { font-size: 2rem !important; }
            .static-page-content h2 { font-size: 1.5rem !important; }
            .static-page-content h3 { font-size: 1.25rem !important; }
            
            .static-page-content p,
            .static-page-content p * {
              font-size: 1.05rem !important;
              color: var(--slate, #475569) !important;
            }

            .static-page-content p {
              margin-bottom: 1rem !important;
            }
            
            .static-page-content ul,
            .static-page-content ol {
              margin-top: 0.5rem !important;
              margin-bottom: 1rem !important;
              padding-left: 2rem !important;
            }
            
            .static-page-content ul, .static-page-content ul * { list-style-type: disc !important; }
            .static-page-content ol, .static-page-content ol * { list-style-type: decimal !important; }
            
            .static-page-content li {
              margin-bottom: 0.25rem !important;
              display: list-item !important;
            }
            
            .static-page-content hr {
              border: 0 !important;
              border-top: 1px solid #e2e8f0 !important;
              margin: 2rem 0 !important;
              display: block !important;
            }

            .static-page-content a,
            .static-page-content a * {
              color: var(--orange, #f97316) !important;
              text-decoration: underline !important;
              font-weight: 600 !important;
            }
            
            .static-page-content strong,
            .static-page-content b,
            .static-page-content strong *,
            .static-page-content b * {
              color: var(--navy, #112240) !important;
              font-weight: 700 !important;
            }
            
            .static-page-content blockquote {
              border-left: 4px solid var(--orange, #f97316) !important;
              padding-left: 1rem !important;
              margin-left: 0 !important;
              font-style: italic !important;
              color: #64748b !important;
              background: #f8fafc !important;
              padding: 1rem !important;
              border-radius: 0 0.5rem 0.5rem 0 !important;
              margin-bottom: 1rem !important;
            }

            .static-page-content img {
              max-width: 100% !important;
              height: auto !important;
              border-radius: 0.5rem !important;
              margin: 1.5rem 0 !important;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
