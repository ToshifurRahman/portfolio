import type { Certificate } from '../content';

type Props = {
  certificate: Certificate;
  onMount: (dialog: HTMLDialogElement | null) => void;
  onClose: () => void;
  onDismiss: () => void;
};

export function CertificateDialog({ certificate, onMount, onClose, onDismiss }: Props) {
  return (
    <dialog className="cv-dialog" aria-labelledby="cv-dialog-title" ref={onMount} onClose={onClose}>
      <h3 id="cv-dialog-title" className="cv-dialog-title display">
        {certificate.title}
      </h3>
      <p className="cv-dialog-meta">
        {certificate.issuer}
        {certificate.date && <span className="cv-period">{certificate.date}</span>}
      </p>
      <img
        className="cv-dialog-image"
        src={certificate.preview}
        width={certificate.width}
        height={certificate.height}
        alt=""
        decoding="async"
      />
      <div className="cv-dialog-actions">
        <a className="action" href={certificate.file} target="_blank" rel="noopener">
          Open original
        </a>
        <button type="button" className="textbutton cv-dialog-close" onClick={onDismiss}>
          Close
        </button>
      </div>
    </dialog>
  );
}
