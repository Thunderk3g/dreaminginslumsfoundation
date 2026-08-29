import { listMedia } from "@/server/admin-cms";
import { ActionForm } from "../../action-form";
import { deleteMediaAction, updateMediaAction, uploadMediaAction } from "../../cms-actions";
import { Empty, Explain, Field, Note, PageHeader, Panel, Pill, control } from "../../ui";

export const dynamic = "force-dynamic";

const FOCAL = ["center", "top", "bottom", "left", "right"];

function size(bytes: number): string {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

/**
 * The photo library.
 *
 * Descriptions are the point of this screen as much as the pictures are: the
 * old website had none at all, so anyone using a screen reader got nothing.
 * Every image without one is called out here rather than left to be noticed.
 */
export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const media = await listMedia({ q });
  const missing = media.filter((m) => !m.alt).length;

  return (
    <>
      <PageHeader title="Photos" meta={`${media.length} in the library`} />

      <Explain>
        Every photograph on the website lives here. Upload once and use it in as many places as you
        like — changing it here changes it everywhere. A description is what someone using a screen
        reader hears in place of the image, so write it as if you were describing the photograph to
        someone on the phone.
      </Explain>

      {missing > 0 ? (
        <Note tone="warn">
          {missing} photograph{missing === 1 ? " has" : "s have"} no description yet.
        </Note>
      ) : null}

      <div className="mt-5 grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
        <div className="space-y-6">
          <Panel title="Add a photograph">
            <div className="p-3">
              <ActionForm action={uploadMediaAction} submitLabel="Upload" variant="primary" size="md">
                <label htmlFor="f-file" className="spec mb-1 block text-ink">
                  The file
                </label>
                <input
                  id="f-file"
                  type="file"
                  name="file"
                  accept="image/*"
                  required
                  className="w-full text-xs text-ink-2 file:mr-2 file:rounded-sm file:border file:border-rule-strong file:bg-surface file:px-2 file:py-1 file:text-xs"
                />
                <div className="mt-3">
                  <Field
                    label="Description"
                    name="alt"
                    placeholder="Girls in blue jerseys warming up on a concrete pitch"
                    hint="Up to 15 MB. Anything you upload is resized and converted automatically."
                  />
                </div>
              </ActionForm>
            </div>
          </Panel>

          <Panel title="Find one">
            <form className="p-3">
              <Field label="Search by file name or description" name="q" defaultValue={q ?? ""} />
              <button
                type="submit"
                className="mt-3 rounded-sm border border-rule-strong px-2.5 py-1 text-xs hover:border-ink hover:bg-paper-deep"
              >
                Search
              </button>
            </form>
          </Panel>
        </div>

        <Panel title="The library">
          {media.length === 0 ? (
            <Empty>
              {q ? "Nothing matches that search." : "Nothing here yet. Upload a photograph on the left."}
            </Empty>
          ) : (
            <ul className="divide-y divide-rule">
              {media.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start gap-4 p-3">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-sm border border-rule">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/media/${item.id}`}
                      alt={item.alt}
                      loading="lazy"
                      className="h-full w-full bg-paper-deep object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-mono text-xs text-ink-2">{item.filename}</p>
                      {item.alt ? null : <Pill tone="warn">No description</Pill>}
                      <Pill>{item.uses === 0 ? "Unused" : `Used ${item.uses}×`}</Pill>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-3">
                      {item.width}×{item.height} · {size(item.bytes)}
                    </p>

                    <ActionForm action={updateMediaAction} submitLabel="Save">
                      <input type="hidden" name="id" value={item.id} />
                      <div className="mt-2 flex flex-wrap items-end gap-2">
                        <div className="min-w-52 flex-1">
                          <label htmlFor={`alt-${item.id}`} className="spec mb-1 block text-ink">
                            Description
                          </label>
                          <input
                            id={`alt-${item.id}`}
                            name="alt"
                            defaultValue={item.alt}
                            className={control}
                          />
                        </div>
                        <div>
                          <label htmlFor={`focal-${item.id}`} className="spec mb-1 block text-ink">
                            Keep in view
                          </label>
                          <select
                            id={`focal-${item.id}`}
                            name="focal_point"
                            defaultValue={item.focal_point}
                            className={control}
                          >
                            {FOCAL.map((point) => (
                              <option key={point} value={point}>
                                {point}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </ActionForm>
                  </div>

                  <ActionForm
                    action={deleteMediaAction}
                    submitLabel="Delete"
                    variant="danger"
                    compact
                    confirm="Delete this photograph from the library?"
                  >
                    <input type="hidden" name="id" value={item.id} />
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
