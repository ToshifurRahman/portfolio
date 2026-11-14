import { owner } from './content';

export function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} {owner.name}
      </p>
    </footer>
  );
}
