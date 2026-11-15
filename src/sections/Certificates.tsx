import { useRef, useState } from 'react';
import { certificates, type Certificate } from '../content';
import { CertificateDialog } from './CertificateDialog';

/* A sub-list of Achievements: one row per certificate. Each row opens the
   certificate's image in a dialog, with a link to the original file. */
export function Certificates() {
  const [open, setOpen] = useState<Certificate | null>(null);
  const dialog = useRef<HTMLDialogElement | null>(null);
  const lastRow = useRef<HTMLButtonElement | null>(null);

  const show = (certificate: Certificate, row: HTMLButtonElement) => {
    lastRow.current = row;
    setOpen(certificate);
  };

  const close = () => dialog.current?.close();

  const afterClose = () => {
    setOpen(null);
    lastRow.current?.focus();
  };

  const mounted = (el: HTMLDialogElement | null) => {
    dialog.current = el;
    if (!el || el.open) return;
    el.showModal();
    el.querySelector<HTMLElement>('.dialog-close')?.focus();
  };

  return (
    <div className="certificates" id="certificates">
      <h3 className="subhead">Certificates</h3>
      <ul className="certificate-list">
        {certificates.map((certificate) => (
          <li key={certificate.slug}>
            <button
              type="button"
              className="certificate"
              aria-haspopup="dialog"
              onClick={(event) => show(certificate, event.currentTarget)}
            >
              <span className="certificate-thumb">
                <img
                  src={certificate.preview}
                  width={certificate.width}
                  height={certificate.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="certificate-text">
                <span className="certificate-title">{certificate.title}</span>
                <span className="certificate-meta">
                  {certificate.issuer}
                  {certificate.date && <span className="certificate-date">{certificate.date}</span>}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open && <CertificateDialog certificate={open} onMount={mounted} onClose={afterClose} onDismiss={close} />}
    </div>
  );
}
