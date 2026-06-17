export interface Random {
  /** Returns a double in [0.0, 1.0). */
  nextDouble(): number;
}

export class DefaultRandom implements Random {
  nextDouble(): number {
    return Math.random();
  }
}
