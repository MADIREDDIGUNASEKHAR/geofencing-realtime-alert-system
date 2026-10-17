// Three large, heavily blurred color blobs that drift slowly behind the
// whole app. This is what gives the glass panels something alive to show
// through — a static gradient reads as flat no matter how much blur you add
// to the foreground.
export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />
    </div>
  )
}
