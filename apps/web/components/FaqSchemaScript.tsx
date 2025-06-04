import React from 'react';
import Head from 'next/head';

interface FAQSchemaProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  clinicName?: string;
}

/**
 * Component to inject FAQ structured data into page head
 * This enables rich snippets in Google search results
 */
const FaqSchemaScript: React.FC<FAQSchemaProps> = ({ faqs, clinicName }) => {
  // Don't render if no FAQs
  if (!faqs || faqs.length === 0) {
    return null;
  }

  // Build the schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  // If we have clinic name, we can also add Local Business schema
  const localBusinessSchema = clinicName ? {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "name": clinicName,
    "@id": "#clinic"
  } : null;

  return (
    <Head>
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
      
      {/* Local Business Schema if clinic name provided */}
      {localBusinessSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema)
          }}
        />
      )}
    </Head>
  );
};

export default FaqSchemaScript;