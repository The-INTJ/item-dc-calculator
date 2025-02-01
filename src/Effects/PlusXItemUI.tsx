import { Effect } from '../values';

type PlusXItemUIProps = {
  effect: Effect;
  onEffectFieldChange: (field: string, value: any) => void;
};

function PlusXItemUI({ effect, onEffectFieldChange }: PlusXItemUIProps) {
  return (
    <div className="+x-item-ui">
      {/* Nothing specific so far... */}
    </div>
  );
}

export default PlusXItemUI;
