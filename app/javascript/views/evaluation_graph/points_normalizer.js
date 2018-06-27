// For taking raw analysis data and updating the polarity
// of the points to graph correctly

import _ from 'underscore'
import Chess from 'chess.js'

import { chess } from '../../chess_mechanism'

export default class PointsNormalizer {

  getGameOverScore(fen) {
    let c = new Chess(fen)
    if (c.in_stalemate()) {
      return 0
    } else if (c.in_checkmate()) {
      if (c.turn() === "w") {
        return -10
      } else {
        return 10
      }
    }
    return 0
  }

  getNormalizedScore(fen) {
    let polarity = /\sw\s/.test(fen) ? 1 : -1
    polarity *= chess.get("polarity")
    let analysis = analysisCache.get(fen)
    if (!analysis || !analysis.variations[0]) {
      return 0
    }
    let score = analysis.variations[0].score
    if (!score) {
      return this.getGameOverScore(fen)
    }
    if (score < -10) {
      score = -10
    } else if (score > 10) {
      score = 10
    }
    if (_.isString(score) && score.match(/^mate/)) {
      let m = +score.split(" ")[1]
      if (m === 0) {
        score = this.getGameOverScore(fen)
      } else {
        score = 10
        score *= (m > 0 ? 1 : -1)
        score *= polarity
      }
    } else {
      score *= polarity
    }
    return score
  }

  getNormalizedScores(fenArray) {
    let scores = []
    for (let fen of fenArray) {
      scores.push(this.getNormalizedScore(fen))
    }
    return scores
  }
}
