import Link from "next/link";
import { PAGE_KEYS } from "@/lib/blocks";
import { RECORD_KINDS, RECORD_SPECS } from "@/lib/records";
import { getConsoleCounts } from "@/server/admin-cms";
import { Explain, Note, PageHeader, Panel, Stat, Table, td, th } from "../ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const counts = await getConsoleCounts();
  const blocksByPage = new Map(counts.blocks.map((row) => [row.page_key, row]));
  const itemsByKind = new Map(counts.items.map((row) => [row.kind, row]));

  return (
    <>
      <PageHeader title="Overview" />

      <Explain>
        Everything on the public website is edited from here. A page is a stack of sections you can
        reorder, show and hide; the lists under Content are what those sections pull in.
      </Explain>

      {counts.media.missing_alt > 0 ? (
        <Note tone="warn">
          {counts.media.missing_alt} photograph{counts.media.missing_alt === 1 ? " has" : "s have"} no
          description. That is what someone using a screen reader hears instead of the image —{" "}
          <Link href="/admin/media">add them under Photos</Link>.
        </Note>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Photographs" value={counts.media.total} href="/admin/media" />
        <Stat
          label="Sections live"
          value={counts.blocks.reduce((sum, row) => sum + row.live, 0)}
          href="/admin/website"
        />
        <Stat
          label="Entries live"
          value={counts.items.reduce((sum, row) => sum + row.live, 0)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Pages">
          <Table>
            <thead>
              <tr>
                <th className={th}>Page</th>
                <th className={th}>Live sections</th>
                <th className={th}>Hidden</th>
              </tr>
            </thead>
            <tbody>
              {PAGE_KEYS.map((page) => {
                const row = blocksByPage.get(page.key);
                const live = row?.live ?? 0;
                const total = row?.total ?? 0;
                return (
                  <tr key={page.key}>
                    <td className={td}>
                      <Link href={`/admin/website/${page.key}`} className="font-medium hover:underline">
                        {page.label}
                      </Link>
                      <div className="text-xs text-ink-2">{page.note}</div>
                    </td>
                    <td className={`${td} font-mono tabular-nums`}>{live}</td>
                    <td className={`${td} font-mono tabular-nums`}>{total - live}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Panel>

        <Panel title="Content lists">
          <Table>
            <thead>
              <tr>
                <th className={th}>List</th>
                <th className={th}>Live</th>
                <th className={th}>Hidden</th>
              </tr>
            </thead>
            <tbody>
              {RECORD_KINDS.map((kind) => {
                const row = itemsByKind.get(kind);
                const live = row?.live ?? 0;
                const total = row?.total ?? 0;
                return (
                  <tr key={kind}>
                    <td className={td}>
                      <Link href={`/admin/lists/${kind}`} className="font-medium hover:underline">
                        {RECORD_SPECS[kind].label}
                      </Link>
                    </td>
                    <td className={`${td} font-mono tabular-nums`}>{live}</td>
                    <td className={`${td} font-mono tabular-nums`}>{total - live}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Panel>
      </div>
    </>
  );
}
