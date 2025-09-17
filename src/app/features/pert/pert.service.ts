/**
 * Serviço para cálculos PERT (Program Evaluation and Review Technique)
 * Implementa beta-PERT com percentis baseados em z-scores
 */

export type Unidade = 'horas' | 'dias';

export interface PertInput {
  O: number;
  M: number;
  P: number;
  unidade: Unidade;
  lambda?: number;
  percentis: (80 | 85 | 90 | 95)[];
}

export interface PertResult {
  media: number;
  sigma: number;
  valores: Record<'P80' | 'P85' | 'P90' | 'P95', number | undefined>;
}

export interface PertHistoryEntry {
  O: number;
  M: number;
  P: number;
  unidade: Unidade;
  lambda: number;
  media: number;
  sigma: number;
  P90: number;
  createdAt: string;
}

/**
 * Z-scores para percentis unilaterais
 * P90 usa 1.2816 (z-score para 90% unilateral)
 */
export const Z_SCORES = {
  80: 0.8416,
  85: 1.036,
  90: 1.2816,
  95: 1.6449
} as const;

/**
 * Calcula a média PERT usando beta-PERT
 * @param O Valor otimista
 * @param M Valor mais provável
 * @param P Valor pessimista
 * @param lambda Parâmetro beta-PERT (padrão 4)
 * @returns Média PERT
 */
export function meanPert(O: number, M: number, P: number, lambda: number = 4): number {
  return (O + lambda * M + P) / (lambda + 2);
}

/**
 * Calcula o desvio padrão PERT
 * @param O Valor otimista
 * @param P Valor pessimista
 * @returns Desvio padrão
 */
export function sigma(O: number, P: number): number {
  return (P - O) / 6;
}

/**
 * Calcula um percentil usando z-score
 * @param mean Média
 * @param sigma Desvio padrão
 * @param percentile Percentil (80, 85, 90, 95)
 * @returns Valor do percentil
 */
export function percentile(mean: number, sigma: number, percentile: 80 | 85 | 90 | 95): number {
  return mean + Z_SCORES[percentile] * sigma;
}

/**
 * Arredonda número para 2 casas decimais
 * @param n Número a ser arredondado
 * @returns Número arredondado
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calcula todos os resultados PERT
 * @param input Dados de entrada
 * @returns Resultados calculados
 */
export function calculate(input: PertInput): PertResult {
  const { O, M, P, lambda = 4, percentis } = input;
  
  const media = meanPert(O, M, P, lambda);
  const sigmaValue = sigma(O, P);
  
  const valores: Record<'P80' | 'P85' | 'P90' | 'P95', number | undefined> = {
    P80: percentis.includes(80) ? round2(percentile(media, sigmaValue, 80)) : undefined,
    P85: percentis.includes(85) ? round2(percentile(media, sigmaValue, 85)) : undefined,
    P90: percentis.includes(90) ? round2(percentile(media, sigmaValue, 90)) : undefined,
    P95: percentis.includes(95) ? round2(percentile(media, sigmaValue, 95)) : undefined
  };

  return {
    media: round2(media),
    sigma: round2(sigmaValue),
    valores
  };
}

/**
 * Converte horas para dias (dividindo por 8)
 * @param horas Valor em horas
 * @returns Valor em dias
 */
export function horasParaDias(horas: number): number {
  return round2(horas / 8);
}

/**
 * Converte dias para horas (multiplicando por 8)
 * @param dias Valor em dias
 * @returns Valor em horas
 */
export function diasParaHoras(dias: number): number {
  return round2(dias * 8);
}
