import { notFound } from "next/navigation";
import { isRecordKind, recordTitle, RECORD_SPECS } from "@/lib/records";
import { getItemForEdit } from "@/server/cms";
import { getPickerOptions, listMedia } from "@/server/admin-cms";
import { ActionForm } from "../../../../action-form";
import { deleteItemAction } from "../../../../cms-actions";
import { RecordEditor } from "../../../../record-editor";
import { Crumbs, PageHeader } from "../../../../ui";

export const dynamic = "force-dynamic";

export default async function EditRecord({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  if (!isRecordKind(kind)) notFound();

  const [item, media, options] = await Promise.all([
    getItemForEdit(id),
    listMedia(),
    getPickerOptions(),
  ]);

  if (!item || item.kind !== kind) notFound();

  const spec = RECORD_SPECS[kind];
  const library = media.map((m) => ({ id: m.id, filename: m.filename, alt: m.alt }));

  return (
    <>
      <PageHeader
        title={recordTitle(kind, item.data)}
        crumbs={
          <Crumbs
            trail={[
              { label: "Content" },
              { label: spec.label, href: `/admin/lists/${kind}` },
              { label: `One ${spec.singular}` },
            ]}
          />
        }
        actions={
          <ActionForm
            action={deleteItemAction}
            submitLabel="Delete"
            variant="danger"
            compact
            confirm={`Delete this ${spec.singular}? Any section showing it loses it. The photograph stays in the library.`}
          >
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="kind" value={kind} />
          </ActionForm>
        }
      />

      <RecordEditor item={item} library={library} options={options} />
    </>
  );
}
