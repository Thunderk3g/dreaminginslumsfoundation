"use client";

import {
  cta,
  id as readId,
  ids as readIds,
  lines as readLines,
  n as readNumber,
  rows as readRows,
  s as readString,
  type FieldSpec,
} from "@/lib/fields";
import { ListEditor, MediaPicker, RefPicker, RefsPicker, RepeatEditor, type MediaOption, type RefOption } from "./pickers";

/**
 * One editor for every field in the console.
 *
 * The section editor and the entry editor both render through this, so a text
 * box behaves the same way whether it is on the homepage hero or on a team
 * member — which is most of what makes this console learnable in one sitting.
 */

const control =
  "w-full rounded-sm border border-rule-strong bg-surface px-2 py-1.5 text-sm text-ink " +
  "focus:border-ink focus:outline-none";

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="spec mb-1 block text-ink">
      {children}
    </label>
  );
}

function Hint({ children }: { children?: string }) {
  return children ? <p className="mt-1 text-xs text-ink-2">{children}</p> : null;
}

export function FieldEditor({
  field,
  data,
  library,
  options,
}: {
  field: FieldSpec;
  data: Record<string, unknown>;
  library: MediaOption[];
  options: Record<string, RefOption[]>;
}) {
  const fieldId = `f-${field.name}`;

  switch (field.kind) {
    case "text":
      return (
        <div>
          <Label htmlFor={fieldId}>{field.label}</Label>
          <input
            id={fieldId}
            name={field.name}
            defaultValue={readString(data, field.name)}
            placeholder={field.placeholder}
            className={control}
          />
          <Hint>{field.hint}</Hint>
        </div>
      );

    case "textarea":
      return (
        <div>
          <Label htmlFor={fieldId}>{field.label}</Label>
          <textarea
            id={fieldId}
            name={field.name}
            rows={field.rows ?? 4}
            defaultValue={readString(data, field.name)}
            className={control}
          />
          <Hint>{field.hint}</Hint>
        </div>
      );

    case "number":
      return (
        <div>
          <Label htmlFor={fieldId}>{field.label}</Label>
          <input
            id={fieldId}
            name={field.name}
            type="number"
            min={field.min}
            max={field.max}
            defaultValue={readNumber(data, field.name, field.min ?? 0)}
            className={`${control} max-w-28`}
          />
          <Hint>{field.hint}</Hint>
        </div>
      );

    case "select":
      return (
        <div>
          <Label htmlFor={fieldId}>{field.label}</Label>
          <select
            id={fieldId}
            name={field.name}
            defaultValue={readString(data, field.name) || field.options[0].value}
            className={control}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Hint>{field.hint}</Hint>
        </div>
      );

    case "link": {
      const value = cta(data, field.name);
      return (
        <div>
          <Label>{field.label}</Label>
          <div className="flex flex-wrap gap-2">
            <input
              name={`${field.name}.label`}
              defaultValue={value?.label ?? ""}
              placeholder="What the button says"
              className={`${control} min-w-40 flex-1`}
            />
            <input
              name={`${field.name}.href`}
              defaultValue={value?.href ?? ""}
              placeholder="/about"
              className={`${control} min-w-40 flex-1 font-mono text-xs`}
            />
          </div>
          <Hint>{field.hint ?? "Leave both empty to hide the button."}</Hint>
        </div>
      );
    }

    case "media":
      return (
        <MediaPicker
          name={field.name}
          label={field.label}
          hint={field.hint}
          value={readId(data, field.name)}
          library={library}
        />
      );

    case "ref":
      return (
        <RefPicker
          name={field.name}
          label={field.label}
          hint={field.hint}
          value={readId(data, field.name)}
          options={options[field.source] ?? []}
        />
      );

    case "refs":
      return (
        <RefsPicker
          name={field.name}
          label={field.label}
          hint={field.hint}
          value={readIds(data, field.name)}
          options={options[field.source] ?? []}
        />
      );

    case "list":
      return (
        <ListEditor
          name={field.name}
          label={field.label}
          hint={field.hint}
          placeholder={field.placeholder}
          value={readLines(data, field.name)}
        />
      );

    case "repeat":
      return (
        <RepeatEditor
          name={field.name}
          label={field.label}
          hint={field.hint}
          addLabel={field.addLabel}
          fields={field.fields}
          value={readRows(data, field.name)}
          library={library}
        />
      );
  }
}
