import { WordAssessment, WordGroup } from '@/lib/types';
import { WordGroup as WordGroupComponent } from './WordGroup';

type ResultsListProps = {
  groups: WordGroup[];
  assessments: Record<string, WordAssessment>;
  pendingAssessments: Record<string, boolean>;
  onAssessmentChange: (wordId: string, assessment: WordAssessment | null) => void;
};

export function ResultsList({
  groups,
  assessments,
  pendingAssessments,
  onAssessmentChange,
}: ResultsListProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70 p-8 text-center text-sm text-stone-500">
        Nenhuma palavra encontrada com essas letras.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <WordGroupComponent
          key={group.id}
          length={group.length}
          entries={group.entries}
          assessments={assessments}
          pendingAssessments={pendingAssessments}
          onAssessmentChange={onAssessmentChange}
        />
      ))}
    </div>
  );
}
