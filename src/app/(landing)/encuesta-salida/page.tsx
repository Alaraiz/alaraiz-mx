import ExitSurveyForm from "./survey-form";

export default function EncuestaSalidaPage() {
  return (
    <main className="public-flow">
      <div className="public-shell">
        <a className="public-back" href="/">
          Volver al inicio
        </a>
        <ExitSurveyForm />
      </div>
    </main>
  );
}
