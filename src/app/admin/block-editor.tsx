"use client";

import { BLOCK_SPECS, type Block, type BlockType } from "@/lib/blocks";
import { saveBlockAction } from "./cms-actions";
import { ActionForm } from "./action-form";
import { FieldEditor } from "./field-editor";
import type { MediaOption, RefOption } from "./pickers";

/** The editor for one section on a page. Its fields come from BLOCK_SPECS. */
export function BlockEditor({
  block,
  library,
  options,
}: {
  block: Block;
  library: MediaOption[];
  options: Record<string, RefOption[]>;
}) {
  const spec = BLOCK_SPECS[block.block_type as BlockType];

  return (
    <ActionForm action={saveBlockAction} submitLabel="Save section" variant="primary" size="md">
      <input type="hidden" name="id" value={block.id} />
      <input type="hidden" name="block_type" value={block.block_type} />
      <input type="hidden" name="page_key" value={block.page_key} />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
        <div className="space-y-5 rounded-sm border border-rule bg-surface p-4">
          {spec.fields.map((field) => (
            <FieldEditor
              key={field.name}
              field={field}
              data={block.data}
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
                defaultChecked={block.is_visible}
                className="mt-0.5 h-4 w-4 accent-[#5b2e91]"
              />
              <span>
                Show this section on the site.
                <span className="mt-0.5 block text-xs text-ink-2">
                  Untick it to take the section down without deleting anything.
                </span>
              </span>
            </label>
          </div>

          <div className="border-t border-rule pt-3">
            <h3 className="spec text-ink">What this is</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{spec.description}</p>
          </div>
        </aside>
      </div>
    </ActionForm>
  );
}
