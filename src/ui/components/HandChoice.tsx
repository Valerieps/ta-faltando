import { useServices, useSettings } from '../services';

/** Right or left hand: every phone control sits on the thumb's side (spec/modo-compra.md). */
export function HandChoice() {
  const { settings } = useServices();
  const { hand } = useSettings();
  return (
    <div className="segmented" role="radiogroup" aria-label="Mão que segura o celular">
      {(['left', 'right'] as const).map((option) => (
        <button key={option} type="button" role="radio" aria-checked={hand === option} className={hand === option ? 'is-on' : ''} onClick={() => void settings.set('hand', option)}>
          {option === 'right' ? 'Mão direita' : 'Mão esquerda'}
        </button>
      ))}
    </div>
  );
}
