interface ObjectiveCardProps {
  description: string;
}

export default function ObjectiveCard({ description }: ObjectiveCardProps) {
  return (
    <div
      className="relative w-40 aspect-[2.5/4.0] rounded-xl border-2 border-amber-500/40 overflow-hidden shadow-lg"
      style={{
        backgroundImage: "url(/card-objective.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <p className="text-black font-semibold text-center leading-tight drop-shadow-md">
          {description}
        </p>
      </div>
    </div>
  );
}
