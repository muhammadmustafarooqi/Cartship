"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  _id: string;
  question: string;
  answer: string;
}

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch('/api/faqs');
        if (response.ok) {
          const data = await response.json();
          setFaqs(data);
        }
      } catch (error) {
        console.error("Failed to fetch FAQs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) return null;

  return (
    <section className="faq-section">
      <div className="page-container faq-inner">
        
        <div className="faq-header">
          <h2 className="faq-title">Got Questions?</h2>
          <div className="faq-underline" />
          <p className="faq-subtitle">
            Find answers to our most commonly asked questions below. If you still need help, our team is available 24/7.
          </p>
          <Link href="/contact" className="faq-contact-btn">
            Contact Support
          </Link>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${openIndex === index ? "open" : ""}`}
            >
              <button 
                className="faq-question-btn" 
                onClick={() => toggle(index)}
                aria-expanded={openIndex === index}
              >
                <span className="faq-question-text">{faq.question}</span>
                <div className="faq-icon-wrapper">
                  {openIndex === index ? <Minus size={20} /> : <Plus size={20} />}
                </div>
              </button>
              <div 
                className="faq-answer-wrapper"
                style={{
                  gridTemplateRows: openIndex === index ? "1fr" : "0fr"
                }}
              >
                <div className="faq-answer-inner">
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .faq-section {
          padding: 120px 0;
          background: var(--cream);
          border-top: 1px solid var(--border-default);
        }

        .faq-inner {
          display: flex;
          gap: 60px;
          align-items: flex-start;
        }

        .faq-header {
          flex: 0 0 350px;
          position: sticky;
          top: 120px;
        }

        .faq-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: clamp(2.5rem, 4vw, 3.5rem);
          font-weight: 900;
          color: var(--navy-deep);
          margin: 0 0 16px;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .faq-underline {
          width: 80px;
          height: 4px;
          background: var(--orange);
          border-radius: 4px;
          margin-bottom: 24px;
        }

        .faq-subtitle {
          font-family: var(--font-jakarta), sans-serif;
          font-size: 1.1rem;
          color: var(--slate);
          line-height: 1.6;
          margin: 0 0 32px;
        }

        .faq-contact-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 28px;
          background: transparent;
          color: var(--navy);
          font-family: var(--font-jakarta), sans-serif;
          font-weight: 700;
          text-decoration: none;
          border: 2px solid var(--navy);
          border-radius: 999px;
          transition: all 0.3s ease;
        }

        .faq-contact-btn:hover {
          background: var(--navy);
          color: var(--white);
        }

        .faq-list {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .faq-item {
          border-bottom: 1px solid var(--border-default);
        }

        .faq-question-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 32px 0;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          gap: 20px;
        }

        .faq-question-text {
          font-family: var(--font-outfit), sans-serif;
          font-size: clamp(1.25rem, 2vw, 1.5rem);
          font-weight: 700;
          color: var(--navy);
          transition: color 0.3s ease;
        }

        .faq-item:hover .faq-question-text {
          color: var(--orange);
        }

        .faq-icon-wrapper {
          color: var(--orange);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .faq-item.open .faq-icon-wrapper {
          transform: rotate(180deg);
        }

        .faq-answer-wrapper {
          display: grid;
          transition: grid-template-rows 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .faq-answer-inner {
          overflow: hidden;
        }

        .faq-answer-inner p {
          font-family: var(--font-jakarta), sans-serif;
          font-size: 1.1rem;
          color: var(--slate);
          line-height: 1.6;
          margin: 0 0 32px 0;
          padding-right: 40px;
        }

        @media (max-width: 900px) {
          .faq-inner {
            flex-direction: column;
            gap: 40px;
          }
          .faq-header {
            flex: none;
            position: relative;
            top: 0;
          }
          .faq-question-btn {
            padding: 24px 0;
          }
        }
      `}</style>
    </section>
  );
}
