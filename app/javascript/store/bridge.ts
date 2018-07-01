import Backbone from 'backbone'

import { FEN } from '../types'
import { chess } from '../chess_mechanism'
import { world } from '../world_state'
import analysisCache from '../analysis/cache'

// temporary bridge between backbone events and vuex store
const initBackboneBridge = (state, getters) => {
  const currentFen = (): FEN => state.positions[state.positionIndex]

  const listener = <any>Object.assign({}, Backbone.Events)

  // chess mechanism events
  listener.listenTo(chess, "change:j", (_, j) => state.variationIndex = j)
  listener.listenTo(chess, "change:k", (_, k) => state.variationPositionIndex = k)
  listener.listenTo(chess, "change:mode", (_, mode) => state.mode = mode)
  listener.listenTo(chess, "analysis:complete", fen => {
    if (fen === currentFen()) {
      state.currentAnalysis = analysisCache.get(fen, getters.analysisOptions(state))
    }
  })
  listener.listenTo(chess, "analysis:options:change", () => {
    const fen = currentFen()
    chess.trigger("analysis:enqueue", fen, getters.analysisOptions(state))
  })
  listener.listenTo(chess, "polarity:flip", () => state.boardPolarity *= -1)

  // world events
  // listener.listenTo(world, "change:moves", (_, moves) => {
  //   state.moves = moves.toArray()
  // })
  // listener.listenTo(world, "change:positions", (_, positions) => {
  //   state.positions = positions.toArray()
  // })
  // listener.listenTo(world, "change:i", (_, i) => {
  //   state.positionIndex = i
  //   const fen = currentFen()
  //   chess.trigger("analysis:enqueue", fen, getters.analysisOptions)
  // })
}

export default initBackboneBridge
