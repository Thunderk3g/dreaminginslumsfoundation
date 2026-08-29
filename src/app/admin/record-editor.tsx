"use client";

import { RECORD_SPECS, type ContentItem } from "@/lib/records";
import { saveItemAction } from "./cms-actions";
import { ActionForm } from "./action-form";
import { FieldEditor } from "./field-editor";
import type { MediaOption, RefOption } from "./pickers";

/**
 * The editor for one entry in a list. Same shape as the section editor, fields
 * from RECORD_SPECS instead of BLOCK_SPECS.
 */
export function RecordEditor({
  item,
  library,
  options,
}: {
  item: ContentItem;
  library: MediaOption[];
  options: Record<string, RefOption[]>;
}) {
  const spec = RECORD_SPECS[item.kind];
  const needsConsent = item.kind === "dreamer_story";

  return (
    <ActionForm action={saveItemAction} submitLabel="Save" variant="primary" size="md">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="kind" value={item.kind} />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
        <div className="space-y-5 rounded-sm border border-rule bg-surface p-4">
          {spec.fields.map((field) => (
            <FieldEditor
              key={field.name}
              field={field}
              data={item.data}
              library={library}
              options={options}
            />
          ))}
        </div>

        <aside className="space-y-4 rounded-sm border border-rule bg-surface p-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Is it live?</h2>
            <label className="mt-2 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="is_visible"
                defaultChecked={item.is_visible}
                className="mt-0.5 h-4 w-4 accent-[#5b2e91]"
              />
              <span>
                Show this on the site.
                <span className="mt-0.5 block text-xs text-ink-2">
                  Untick it to take it down without deleting anything.
                </span>
              </span>
            </label>
            {needsConsent ? (
              <p className="mt-2 border border-warn bg-warn-soft px-2 py-1.5 text-xs text-warn">
                This stays hidden until Consent on file says yes, whatever this switch says.
              </p>
            ) : null}
          </div>

          <div className="border-t border-rule pt-3">
            <h3 className="spec text-ink">What this list is</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{spec.description}</p>
          </div>
        </aside>
      </div>
    </ActionForm>
  );
}
