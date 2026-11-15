import type { Certificate } from '../content';

type Props = {
  certificate: Certificate;
  onMount: (dialog: HTMLDialogElement | null) => void;
  onClose: () => void;
  onDismiss: () => void;
};

export function CertificateDialog({ certificate, onMount, onClose, onDismiss }: Props) {
  return (
    <dialog
      className="dialog"
      aria-labelledby="dialog-title"
      ref={onMount}
      onClose={onClose}
      onClick={(event) => {
        /* A click on the backdrop (the dialog element itself) closes it. */
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div className="dialog-body">
        <h3 id="dialog-title" className="dialog-title">
          {certificate.title}
        </h3>
        <p className="dialog-meta">
          {certificate.issuer}
          {certificate.date && <span className="certificate-date">{certificate.date}</span>}
        </p>
        <img
          className="dialog-image"
          src={certificate.preview}
          width={certificate.width}
          height={certificate.height}
          alt=""
          decoding="async"
        />
        <div className="dialog-actions">
          <a className="inline-link" href={certificate.file} target="_blank" rel="noopener">
            Open original
          </a>
          <button type="button" className="text-button dialog-close" onClick={onDismiss}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
