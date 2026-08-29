import { readBrand } from "@/lib/site-settings";
import { getSettingRaw } from "@/server/cms";
import { ActionForm } from "../../../action-form";
import { saveBrandAction } from "../../../cms-actions";
import { Explain, Field, Note, PageHeader, Panel } from "../../../ui";

export const dynamic = "force-dynamic";

const COLOURS = [
  { name: "color_primary", label: "Primary", hint: "The purple in the logo. Headings and buttons." },
  { name: "color_secondary", label: "Secondary", hint: "The blue in the logo." },
  { name: "color_accent", label: "Accent", hint: "The green in the logo." },
  { name: "color_ink", label: "Text", hint: "Body text. Near-black rather than pure black reads more easily." },
  { name: "color_paper", label: "Background", hint: "The page behind everything." },
] as const;

export default async function BrandPage() {
  const brand = readBrand(await getSettingRaw("brand"));

  return (
    <>
      <PageHeader title="Brand colours" />

      <Explain>
        These are sampled from the logo — the purple, blue and green of the hands around the
        football. They are a starting point, not the finished design.
      </Explain>

      <Note>
        Write colours as a hex code with a leading hash, like <code>#5B2E91</code>. Anything else is
        ignored and the previous colour is kept.
      </Note>

      <div className="mt-5 max-w-xl">
        <Panel title="Palette">
          <div className="p-3">
            <ActionForm action={saveBrandAction} submitLabel="Save colours" variant="primary" size="md">
              <div className="space-y-4">
                {COLOURS.map((colour) => (
                  <div key={colour.name} className="flex items-end gap-3">
                    <span
                      aria-hidden
                      className="h-10 w-10 shrink-0 rounded-sm border border-rule-strong"
                      style={{ background: brand[colour.name] }}
                    />
                    <Field
                      className="flex-1"
                      label={colour.label}
                      name={colour.name}
                      defaultValue={brand[colour.name]}
                      hint={colour.hint}
                    />
                  </div>
                ))}
              </div>
            </ActionForm>
          </div>
        </Panel>
      </div>
    </>
  );
}
