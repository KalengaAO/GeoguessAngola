
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

import {
    getGameStatus,
    submitGameAnswer,
    timeoutRound,
    startNextRound,
} from "../services/gameService";

export const RESULT_DISPLAY_SECONDS = 6;

const DEFAULT_TIME_LIMIT = 30;

function toLocation(latitude, longitude) {
    return latitude != null && longitude != null
        ? {
              latitude: Number(latitude),
              longitude: Number(longitude),
          }
        : null;
}

export default function useGameSession(sessionId) {
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [roundResult, setRoundResult] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [advanceFailed, setAdvanceFailed] = useState(false);

    const [secondsLeft, setSecondsLeft] = useState(DEFAULT_TIME_LIMIT);
    const [resultCountdown, setResultCountdown] = useState(
        RESULT_DISPLAY_SECONDS
    );

    const submittingRef = useRef(false);
    const advancingRef = useRef(false);
    const timeUpRoundRef = useRef(null);
    const deadlineRef = useRef(null);

    // ---------- Aplicar estado recebido da API ----------

    const applyStatus = useCallback((data) => {
        setStatus(data);
        setAdvanceFailed(false);

        const rounds = data.rounds || [];
        const current = rounds[rounds.length - 1];

        if (current?.is_answered) {
            deadlineRef.current = null;

            const guessedLocation = toLocation(
                current.guessed_latitude,
                current.guessed_longitude
            );

            setRoundResult({
                round_id: current.id,
                distance_km: current.distance_km,
                score: current.score,
                correct_location: current.correct_location,
                guessed_location: guessedLocation,
                timed_out: current.timed_out ?? guessedLocation === null,
            });

            setSelectedLocation(guessedLocation);
            setResultCountdown(RESULT_DISPLAY_SECONDS);
        } else {
            const remaining =
                current?.seconds_remaining ??
                data.time_limit_seconds ??
                DEFAULT_TIME_LIMIT;

            deadlineRef.current = Date.now() + remaining * 1000;

            setSecondsLeft(Math.ceil(remaining));
            setRoundResult(null);
            setSelectedLocation(null);
            setResultCountdown(RESULT_DISPLAY_SECONDS);
        }
    }, []);

    // ---------- Carregar partida ----------

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setIsLoading(true);
                setLoadError(false);

                const data = await getGameStatus(sessionId);

                if (!cancelled) {
                    applyStatus(data);
                }
            } catch (error) {
                console.error("Erro ao carregar a partida:", error);

                if (!cancelled) {
                    setLoadError(true);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [sessionId, applyStatus]);

    // ---------- Dados derivados ----------

    const rounds = status?.rounds ?? [];

    const round = rounds.length
        ? rounds[rounds.length - 1]
        : null;

    const totalRounds =
        status?.progress?.total_rounds ?? rounds.length;

    const totalScore = status?.total_score ?? 0;

    const timeLimit =
        status?.time_limit_seconds ?? DEFAULT_TIME_LIMIT;

    const isFinished =
        status?.is_finished === true ||
        status?.session_status === "completed";

    const isLastRound = round
        ? round.number >= totalRounds
        : false;

    // ---------- Fechar ronda ----------

    const finishRound = useCallback(
        async (request) => {
            if (!round || roundResult || submittingRef.current) {
                return false;
            }

            submittingRef.current = true;
            setIsSubmitting(true);

            try {
                const result = await request(round.id);

                deadlineRef.current = null;

                const guessedLocation =
                    result.guessed_location ??
                    toLocation(
                        result.guessed_latitude,
                        result.guessed_longitude
                    );

                const normalizedResult = {
                    ...result,
                    guessed_location: guessedLocation,
                    guessed_latitude: guessedLocation?.latitude ?? null,
                    guessed_longitude: guessedLocation?.longitude ?? null,
                };

                setRoundResult(normalizedResult);
                setSelectedLocation(guessedLocation);
                setResultCountdown(RESULT_DISPLAY_SECONDS);

                setStatus((prev) =>
                    prev
                        ? {
                              ...prev,
                              total_score:
                                  result.session_total_score ??
                                  prev.total_score,
                              progress: {
                                  ...prev.progress,
                                  answered_rounds:
                                      (prev.progress?.answered_rounds ?? 0) + 1,
                              },
                              rounds: prev.rounds.map((r) =>
                                  r.id === result.round_id
                                      ? {
                                            ...r,
                                            is_answered: true,
                                            seconds_remaining: null,
                                            score: result.score,
                                            distance_km: result.distance_km,
                                            correct_location:
                                                result.correct_location,
                                            timed_out:
                                                result.timed_out ?? false,
                                            guessed_latitude:
                                                guessedLocation?.latitude ?? null,
                                            guessed_longitude:
                                                guessedLocation?.longitude ?? null,
                                        }
                                      : r
                              ),
                          }
                        : prev
                );

                return true;
            } catch (error) {
                console.error("Erro ao fechar a ronda:", error);

                toast.error(
                    error.response?.data?.detail ||
                        "Não foi possível submeter a tua resposta."
                );

                return false;
            } finally {
                submittingRef.current = false;
                setIsSubmitting(false);
            }
        },
        [round, roundResult]
    );

    // ---------- Submeter palpite ----------

    const submitGuess = useCallback(() => {
        if (!selectedLocation) {
            toast.error("Selecciona primeiro uma localização no mapa.");
            return Promise.resolve(false);
        }

        return finishRound((roundId) =>
            submitGameAnswer(roundId, selectedLocation)
        );
    }, [selectedLocation, finishRound]);

    // ---------- Tempo esgotado ----------

    const handleTimeUp = useCallback(async () => {
        if (!round || roundResult) return;

        if (timeUpRoundRef.current === round.id) return;

        timeUpRoundRef.current = round.id;

        const ok = await finishRound((roundId) => timeoutRound(roundId));

        if (!ok) {
            setTimeout(() => {
                timeUpRoundRef.current = null;
            }, 2000);
        }
    }, [round, roundResult, finishRound]);

    // ---------- Avançar para a próxima ronda ----------

    const goToNextRound = useCallback(async () => {
        if (advancingRef.current || !roundResult) return;

        advancingRef.current = true;
        setIsAdvancing(true);
        setAdvanceFailed(false);

        try {
            // 1. Solicita ao backend o avanço da partida.
            await startNextRound(sessionId);

            // 2. Recupera o estado actualizado da partida.
            const fresh = await getGameStatus(sessionId);

            // 3. Actualiza o estado React.
            applyStatus(fresh);
        } catch (error) {
            console.error("Erro ao avançar:", error);

            toast.error(
                error.response?.data?.detail ||
                    "Não foi possível avançar para a próxima ronda."
            );

            setAdvanceFailed(true);
        } finally {
            advancingRef.current = false;
            setIsAdvancing(false);
        }
    }, [sessionId, roundResult, applyStatus]);

    const latestRef = useRef({});

    useEffect(() => {
        latestRef.current = {
            handleTimeUp,
            goToNextRound,
        };
    }, [handleTimeUp, goToNextRound]);

    // ---------- Temporizador da ronda ----------

    const roundId = round?.id;

    useEffect(() => {
        if (!roundId || roundResult || isFinished) {
            return undefined;
        }

        function tick() {
            if (deadlineRef.current == null) return;

            const left = Math.max(
                0,
                Math.ceil((deadlineRef.current - Date.now()) / 1000)
            );

            setSecondsLeft(left);

            if (left <= 0) {
                latestRef.current.handleTimeUp();
            }
        }

        tick();

        const id = setInterval(tick, 250);

        return () => clearInterval(id);
    }, [roundId, roundResult, isFinished]);

    // ---------- Contagem até à próxima ronda ----------

    useEffect(() => {
        if (!roundId || !roundResult || isFinished) {
            return undefined;
        }

        let left = RESULT_DISPLAY_SECONDS;

        const id = setInterval(() => {
            left -= 1;

            setResultCountdown(Math.max(0, left));

            if (left <= 0) {
                clearInterval(id);
                latestRef.current.goToNextRound();
            }
        }, 1000);

        return () => clearInterval(id);
    }, [roundId, roundResult, isFinished]);

    // ---------- Dados e acções disponibilizados à página ----------
        
    return {
        round,
        rounds,
        totalRounds,
        totalScore,
        timeLimit,

        selectedLocation,
        roundResult,

        secondsLeft,
        resultCountdown,

        isLoading,
        loadError,
        isSubmitting,
        isAdvancing,
        advanceFailed,
        isFinished,
        isLastRound,

        setSelectedLocation,
        submitGuess,
        goToNextRound,
    };
}
