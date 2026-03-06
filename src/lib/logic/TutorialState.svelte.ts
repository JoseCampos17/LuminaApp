export class TutorialState {
  constructor(
    private props: {
      step: number;
      onNext: () => void;
      onComplete: () => void;
    },
  ) {}

  get step() {
    return this.props.step;
  }

  next = () => {
    this.props.onNext();
  };

  complete = () => {
    this.props.onComplete();
  };
}
