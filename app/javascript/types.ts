export type HTML = string

export type PGN = string
export type FEN = string
export type SanMove = string  // e3, h4, Nf6
export type UciMove = string  // a1a2, g4g7

export interface ChessMove {  // used by Chess.js
  from: string
  to: string
  promotion?: string
}

export interface Analysis {
  fen: FEN
  bestmove: UciMove
  engine: string
  variations: Array<Variation>
}

// sent to stockfish worker
export interface AnalysisOptions {
  multipv?: number
  depth?: number
}
