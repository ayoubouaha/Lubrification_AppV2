import { GRADE_RGB, GRADE_LABEL, type LubricationGrade } from '../../diagram/diagramPointUtils';
import './DosageLegend.css';

/** Status key for the schema markers / cards, ordered from over-dosed to severely under-dosed. */
const LEGEND_ITEMS: { grade: LubricationGrade; range: string }[] = [
  { grade: 'surdose', range: '> +10 %' },
  { grade: 'conforme', range: '−10 % à +10 %' },
  { grade: 'sousdose', range: '−10 % à −50 %' },
  { grade: 'critique', range: '< −50 %' },
];

const DosageLegend = () => {
  return (
    <aside className="dosage-legend" aria-label="Statuts de dosage">
      <p className="dosage-legend__title">Statuts de dosage</p>
      <ul className="dosage-legend__list">
        {LEGEND_ITEMS.map(({ grade, range }) => (
          <li key={grade} className="dosage-legend__item">
            <span
              className="dosage-legend__dot"
              style={{ backgroundColor: `rgb(${GRADE_RGB[grade]})` }}
              aria-hidden="true"
            />
            <span className="dosage-legend__label">{GRADE_LABEL[grade]}</span>
            <span className="dosage-legend__range">{range}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default DosageLegend;
