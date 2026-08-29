import { notFound } from "next/navigation";
import { BLOCK_SPECS, blockSummary, isPageKey, PAGE_KEYS } from "@/lib/blocks";
import { getBlockForEdit } from "@/server/cms";
import { getPickerOptions, listMedia } from "@/server/admin-cms";
import { ActionForm } from "../../../../action-form";
import { BlockEditor } from "../../../../block-editor";
import { deleteBlockAction } from "../../../../cms-actions";
import { Crumbs, PageHeader } from "../../../../ui";

export const dynamic = "force-dynamic";

export default async function EditBlock({
  params,
}: {
  params: Promise<{ page: string; block: string }>;
}) {
  const { page, block: blockId } = await params;
  if (!isPageKey(page)) notFound();

  const [block, media, options] = await Promise.all([
    getBlockForEdit(blockId),
    listMedia(),
    getPickerOptions(),
  ]);

  if (!block || block.page_key !== page) notFound();

  const meta = PAGE_KEYS.find((p) => p.key === page)!;
  const library = media.map((m) => ({ id: m.id, filename: m.filename, alt: m.alt }));

  return (
    <>
      <PageHeader
        title={blockSummary(block.block_type, block.data)}
        crumbs={
          <Crumbs
            trail={[
              { label: "Pages & sections", href: "/admin/website" },
              { label: meta.label, href: `/admin/website/${page}` },
              { label: BLOCK_SPECS[block.block_type].label },
            ]}
          />
        }
        actions={
          <ActionForm
            action={deleteBlockAction}
            submitLabel="Delete section"
            variant="danger"
            compact
            confirm="Delete this section? Its words and settings go with it. The photographs stay in the library."
          >
            <input type="hidden" name="id" value={block.id} />
            <input type="hidden" name="page_key" value={page} />
          </ActionForm>
        }
      />

      <BlockEditor block={block} library={library} options={options} />
    </>
  );
}
