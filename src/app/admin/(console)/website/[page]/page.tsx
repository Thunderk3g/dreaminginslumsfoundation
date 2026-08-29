import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOCK_SPECS, BLOCK_TYPES, blockSummary, isPageKey, PAGE_KEYS } from "@/lib/blocks";
import { getPageBlocksForEdit } from "@/server/cms";
import { ActionForm } from "../../../action-form";
import { createBlockAction, moveBlockAction, toggleBlockAction } from "../../../cms-actions";
import { Crumbs, Empty, Explain, LivePill, PageHeader, Panel, Table, control, td, th } from "../../../ui";

export const dynamic = "force-dynamic";

/**
 * One page, as the stack of sections it is made of.
 *
 * Reordering and show/hide are one click each from this list, because those are
 * the two things anybody does most and neither should need opening a section.
 */
export default async function PageSections({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!isPageKey(page)) notFound();

  const meta = PAGE_KEYS.find((p) => p.key === page)!;
  const blocks = await getPageBlocksForEdit(page);

  return (
    <>
      <PageHeader
        title={meta.label}
        crumbs={<Crumbs trail={[{ label: "Pages & sections", href: "/admin/website" }, { label: meta.label }]} />}
        meta={
          <>
            {meta.note}{" "}
            <a href={meta.path} target="_blank" rel="noreferrer" className="underline">
              View the page ↗
            </a>
          </>
        }
      />

      <Explain>
        A page is a stack of sections, top to bottom. Move them with the arrows, take one down with
        Hide, or open it to change the words and photographs inside it.
      </Explain>

      <div className="mb-5 flex flex-wrap gap-2">
        {PAGE_KEYS.map((other) => (
          <Link
            key={other.key}
            href={`/admin/website/${other.key}`}
            className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
              other.key === page
                ? "border-clay bg-clay text-white"
                : "border-rule-strong hover:border-ink hover:bg-paper-deep"
            }`}
          >
            {other.label}
          </Link>
        ))}
      </div>

      <Panel title={`${blocks.length} section${blocks.length === 1 ? "" : "s"}`}>
        {blocks.length === 0 ? (
          <Empty>Nothing on this page yet. Add a section below and it will appear here.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>Order</th>
                <th className={th}>Section</th>
                <th className={th}>Status</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {blocks.map((block, index) => (
                <tr key={block.id}>
                  <td className={td}>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs tabular-nums text-ink-3">{index + 1}</span>
                      <ActionForm action={moveBlockAction} submitLabel="↑" compact>
                        <input type="hidden" name="id" value={block.id} />
                        <input type="hidden" name="page_key" value={page} />
                        <input type="hidden" name="direction" value="up" />
                      </ActionForm>
                      <ActionForm action={moveBlockAction} submitLabel="↓" compact>
                        <input type="hidden" name="id" value={block.id} />
                        <input type="hidden" name="page_key" value={page} />
                        <input type="hidden" name="direction" value="down" />
                      </ActionForm>
                    </div>
                  </td>
                  <td className={td}>
                    <Link
                      href={`/admin/website/${page}/${block.id}`}
                      className="font-medium hover:underline"
                    >
                      {blockSummary(block.block_type, block.data)}
                    </Link>
                    <div className="text-xs text-ink-2">{BLOCK_SPECS[block.block_type].label}</div>
                  </td>
                  <td className={td}>
                    <LivePill live={block.is_visible} />
                  </td>
                  <td className={td}>
                    <ActionForm
                      action={toggleBlockAction}
                      submitLabel={block.is_visible ? "Hide" : "Show"}
                      compact
                    >
                      <input type="hidden" name="id" value={block.id} />
                      <input type="hidden" name="page_key" value={page} />
                    </ActionForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <div className="mt-6 max-w-xl rounded-sm border border-rule bg-surface p-4">
        <h2 className="text-base font-semibold">Add a section</h2>
        <p className="mt-1 text-sm text-ink-2">
          It is added at the bottom and starts hidden, so nothing changes on the live site until you
          fill it in and tick Show.
        </p>
        <ActionForm action={createBlockAction} submitLabel="Add it" variant="primary" size="md">
          <input type="hidden" name="page_key" value={page} />
          <label htmlFor="f-block_type" className="spec mt-3 mb-1 block text-ink">
            What kind of section
          </label>
          <select id="f-block_type" name="block_type" className={control} defaultValue="story">
            {BLOCK_TYPES.map((type) => (
              <option key={type} value={type}>
                {BLOCK_SPECS[type].label} — {BLOCK_SPECS[type].description}
              </option>
            ))}
          </select>
        </ActionForm>
      </div>
    </>
  );
}
