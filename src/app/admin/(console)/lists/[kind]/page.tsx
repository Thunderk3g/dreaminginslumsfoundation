import Link from "next/link";
import { notFound } from "next/navigation";
import { isRecordKind, recordSubtitle, recordThumb, recordTitle, RECORD_SPECS } from "@/lib/records";
import { getItemsForEdit } from "@/server/cms";
import { ActionForm } from "../../../action-form";
import { createItemAction, moveItemAction, toggleItemAction } from "../../../cms-actions";
import { Crumbs, Empty, Explain, LivePill, PageHeader, Panel, Pill, Table, td, th } from "../../../ui";

export const dynamic = "force-dynamic";

/**
 * One list, whichever it is. There is no per-kind screen: the columns and the
 * editor both come from RECORD_SPECS, so adding a list to the site adds a
 * screen to the console for free.
 */
export default async function ListPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isRecordKind(kind)) notFound();

  const spec = RECORD_SPECS[kind];
  const items = await getItemsForEdit(kind);

  const addButton = (
    <ActionForm action={createItemAction} submitLabel={`Add ${spec.singular}`} variant="primary" compact>
      <input type="hidden" name="kind" value={kind} />
    </ActionForm>
  );

  return (
    <>
      <PageHeader
        title={spec.label}
        crumbs={<Crumbs trail={[{ label: "Content" }, { label: spec.label }]} />}
        actions={addButton}
      />

      <Explain>{spec.description}</Explain>

      <Panel title={`${items.length} entr${items.length === 1 ? "y" : "ies"}`}>
        {items.length === 0 ? (
          <Empty action={addButton}>{spec.empty}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>Order</th>
                {spec.thumbField ? <th className={th} /> : null}
                <th className={th}>Entry</th>
                <th className={th}>Status</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const thumb = recordThumb(kind, item.data);
                const needsConsent = kind === "dreamer_story" && item.data.consent !== "yes";
                return (
                  <tr key={item.id}>
                    <td className={td}>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs tabular-nums text-ink-3">{index + 1}</span>
                        <ActionForm action={moveItemAction} submitLabel="↑" compact>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="kind" value={kind} />
                          <input type="hidden" name="direction" value="up" />
                        </ActionForm>
                        <ActionForm action={moveItemAction} submitLabel="↓" compact>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="kind" value={kind} />
                          <input type="hidden" name="direction" value="down" />
                        </ActionForm>
                      </div>
                    </td>

                    {spec.thumbField ? (
                      <td className={td}>
                        <div className="h-12 w-12 overflow-hidden rounded-sm border border-rule">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/media/${thumb}`}
                              alt=""
                              loading="lazy"
                              className="h-full w-full bg-paper-deep object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-paper-deep text-[0.5625rem] text-ink-3">
                              None
                            </div>
                          )}
                        </div>
                      </td>
                    ) : null}

                    <td className={td}>
                      <Link href={`/admin/lists/${kind}/${item.id}`} className="font-medium hover:underline">
                        {recordTitle(kind, item.data)}
                      </Link>
                      {recordSubtitle(kind, item.data) ? (
                        <div className="text-xs text-ink-2">{recordSubtitle(kind, item.data)}</div>
                      ) : null}
                    </td>

                    <td className={td}>
                      <div className="flex flex-wrap gap-1">
                        <LivePill live={item.is_visible} />
                        {needsConsent ? <Pill tone="warn">No consent</Pill> : null}
                      </div>
                    </td>

                    <td className={td}>
                      <ActionForm
                        action={toggleItemAction}
                        submitLabel={item.is_visible ? "Hide" : "Show"}
                        compact
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="kind" value={kind} />
                      </ActionForm>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
