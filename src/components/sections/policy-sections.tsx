import { PolicySection } from '@/data/policies';

interface PolicySectionsProps {
  sections: PolicySection[];
}

export function PolicySections({ sections }: PolicySectionsProps) {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <section key={index}>
          <h2 className="font-manrope text-base font-semibold leading-none tracking-tight-2 text-navy">
            {section.title}
          </h2>
          <div className="mt-4 space-y-4 text-xs font-light leading-[1.61] text-slate-600">
            {section.paragraphs.map((paragraph, pIndex) => (
              <p key={pIndex}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
