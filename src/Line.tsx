/* A line of stations: a small track drawn in CSS. In sequence the rail joins
   the stations; siblings (parts that sit side by side) get no rail. */
export function Line({ label, nodes, siblings = false }: { label: string; nodes: string[]; siblings?: boolean }) {
  return (
    <ol className={siblings ? 'line siblings' : 'line'} aria-label={siblings ? label : `${label}, in order`}>
      {nodes.map((node) => (
        <li key={node}>{node}</li>
      ))}
    </ol>
  );
}
