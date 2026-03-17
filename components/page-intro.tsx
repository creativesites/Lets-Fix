type PageIntroProps = {
  label: string;
  title: string;
  text: string;
};

export function PageIntro({ label, title, text }: PageIntroProps) {
  return (
    <div className="sectionHeading pageIntro">
      <span className="sectionLabel">{label}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

