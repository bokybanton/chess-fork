// Handles fetching analysis from remote server + rendering it

import * as $ from 'jquery'
import * as _ from 'underscore'
import Chess from 'chess.js'

import { chess } from './chess_mechanism'

interface Variation {
  depth: number
  multipv: number
  score: number
  sequence: Array<string>
  n: number //
}

interface Analysis {
  bestmove: string
  engine: string
  variations: Array<Variation>
}

interface RemoteOptions {
  fen?: string
  multipv?: number
  depth?: number
}

interface ChessMove {
  from: string
  to: string
  promotion?: string
}

class AnalysisCache {
  private calculator: Chess
  private analysisMap: { [fen: string] : Analysis }

  constructor() {
    this.calculator = new Chess()
    this.analysisMap = {}
  }

  get(fen: string): Analysis {
    return this.analysisMap[fen]
  }

  set(fen: string, analysis: Analysis) {
    this.analysisMap[fen] = analysis
  }

  remoteGet(fen, options: RemoteOptions = {}): Promise<Analysis> {
    options.fen = fen
    chess.trigger("analysis:pending")
    return new Promise((resolve, reject) => {
      $.ajax({
        url: "/analysis",
        type: "POST",
        data: options,
        dataType: "json",
        context: this,
        success: (data, status, xhr) => {
          resolve(this.formatAnalysisResponse(data, fen))
        },
        error: (xhr, status, error) => {
          reject(fen)
        }
      })
    })
  }

  getAnalysis(fen): Promise<Analysis> {
    return new Promise((resolve, reject) => {
      let analysis = this.get(fen)
      if (analysis) {
        resolve(analysis)
      } else {
        this.remoteGet(fen).
          then((analysis) => {
            this.set(fen, analysis)
            return analysis
          }).
          then(this.notifyAnalysis).
          then(resolve)
      }
    })
  }

  notifyAnalysis(analysis): Analysis {
    chess.trigger("change:analysis", analysis)
    return analysis
  }

  uciToMove(uciMove): ChessMove {
    const move: ChessMove = {
      from: uciMove.slice(0,2),
      to: uciMove.slice(2,4)
    }
    if (uciMove.length === 5) {
      move.promotion = uciMove[4]
    }
    return move
  }

  formatAnalysisResponse(data, fen): Analysis {
    data.fen = fen
    for (let i in data.variations) {
      let variation = data.variations[i]
      let formatted = this.calcMovesAndPositions(fen, variation.sequence)
      data.variations[i] = _.extend(variation, formatted)
    }
    return data
  }

  // TODO lazy calculate this using a generator
  //
  calcMovesAndPositions(fen, sequence) {
    this.calculator.load(fen)
    let moves = []
    let positions = [fen]
    for (let uciMove of sequence) {
      let move = this.calculator.move(this.uciToMove(uciMove))
      moves.push(move.san)
      positions.push(this.calculator.fen())
    }
    return {
      moves: moves,
      positions: positions,
      n: moves.length
    }
  }
}

const analysisCache = new AnalysisCache

export default analysisCache
