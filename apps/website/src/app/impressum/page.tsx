import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Impressum — Powerhouse 360",
  description:
    "Anbieterkennzeichnung der AKL Powerhouse 360 GmbH gemäß § 5 DDG.",
};

export default function ImpressumPage() {
  return (
    <LegalShell title="Impressum" stand="Juli 2026">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        <strong>AKL Powerhouse 360 GmbH</strong>
        <br />
        Charlottenburger Straße 2
        <br />
        13086 Berlin
        <br />
        Deutschland
      </p>
      <p>
        <strong>Vertreten durch:</strong> Geschäftsführer Leon Liedtke
      </p>
      <p>
        <strong>Registergericht:</strong> Amtsgericht Charlottenburg (Berlin)
        <br />
        <strong>Registernummer:</strong> HRB 286461 B
        <br />
        <strong>Rechtsform:</strong> Gesellschaft mit beschränkter Haftung
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail:{" "}
        <a href="mailto:info@powerhouse360.de">info@powerhouse360.de</a>
      </p>
      <p>
        Für eine schnelle elektronische Kontaktaufnahme und unmittelbare
        Kommunikation stehen die genannte E-Mail-Adresse sowie die
        Anfrageformulare dieser Website zur Verfügung.
      </p>
      <p>
        Datenschutzanfragen:{" "}
        <a href="mailto:datenschutz@powerhouse360.de">
          datenschutz@powerhouse360.de
        </a>
        <br />
        Sicherheitsmeldungen:{" "}
        <a href="mailto:security@powerhouse360.de">
          security@powerhouse360.de
        </a>
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Unser Angebot richtet sich an Unternehmen, Hausverwaltungen,
        Wohnungseigentümergemeinschaften, Bestandshalter, Stadtwerke und
        Betreiber. Zur Teilnahme an einem Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nehmen
        daran nicht teil.
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach
        den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht
        verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
        überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
        Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der
        Nutzung von Informationen nach den allgemeinen Gesetzen bleiben
        hiervon unberührt. Eine diesbezügliche Haftung ist erst ab dem
        Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
        Bekanntwerden entsprechender Rechtsverletzungen entfernen wir diese
        Inhalte umgehend.
      </p>

      <h2>Haftung für Links</h2>
      <p>
        Unser Angebot kann Links zu externen Websites Dritter enthalten, auf
        deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte
        übernehmen wir keine Gewähr; verantwortlich ist stets der jeweilige
        Anbieter oder Betreiber der verlinkten Seiten. Die verlinkten Seiten
        wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße
        überprüft; rechtswidrige Inhalte waren dabei nicht erkennbar. Eine
        permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne
        konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei
        Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links
        umgehend.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen
        Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
        Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
        Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung der
        AKL Powerhouse 360 GmbH. Downloads und Kopien dieser Seite sind nur
        für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit
        Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden
        die Urheberrechte Dritter beachtet. Sollten Sie trotzdem auf eine
        Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
        entsprechenden Hinweis.
      </p>
    </LegalShell>
  );
}
