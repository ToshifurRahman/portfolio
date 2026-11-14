import { useRef, useState } from 'react';
import { certificates, type Certificate } from '../content';
import { CertificateDialog } from './CertificateDialog';
import { Section } from '../Section';

export function Certificates() {
  const [open, setOpen] = useState<Certificate | null>(null);
  const dialog = useRef<HTMLDialogElement | null>(null);
  const lastCard = useRef<HTMLButtonElement | null>(null);

  const show = (certificate: Certificate, card: HTMLButtonElement) => {
    lastCard.current = card;
    setOpen(certificate);
  };

  const close = () => dialog.current?.close();

  const afterClose = () => {
    setOpen(null);
    lastCard.current?.focus();
  };

  const mounted = (el: HTMLDialogElement | null) => {
    dialog.current = el;
    if (!el || el.open) return;
    el.showModal();
    el.querySelector<HTMLElement>('.cv-dialog-close')?.focus();
  };

  return (
    <Section id="certificates" title="Certificates">
      <ul className="cv-certificates">
        {certificates.map((certificate) => (
          <li key={certificate.slug}>
            <button
              type="button"
              className="cv-card"
              onClick={(event) => show(certificate, event.currentTarget)}
            >
              <span className="cv-card-image">
                <img
                  src={certificate.preview}
                  width={certificate.width}
                  height={certificate.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="cv-card-title display">{certificate.title}</span>
              <span className="cv-card-meta">
                {certificate.issuer}
                {certificate.date && <span className="cv-period">{certificate.date}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open && (
        <CertificateDialog
          certificate={open}
          onMount={mounted}
          onClose={afterClose}
          onDismiss={close}
        />
      )}
    </Section>
  );
}
