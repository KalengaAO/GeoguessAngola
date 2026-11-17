import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

import {
    getGameStats,
    submitGameAnswer,
    timeoutRound,
    startNextRound,
} from "../services/gameService";

// Tempo em que o resultado fica visível antes de avançar sozinho.
export const RESULT_DISPLAY_SECONDS = 6;

const DEFAULT_TIME_LIMIT = 30;

function toLocation(latitude, longitude) {
    return latitude != null && longitude != null
        ? { latitude, longitude }
        : null;
}

/**
 * Lógica de uma partida single-player.
 *
 * - O servidor é a fonte da verdade (tudo vem de /status/).
 * - Cada ronda tem um limite de tempo (30s). Se o tempo acabar, o palpite
 *   escolhido é enviado automaticamente; sem palpite, a ronda vale 0.
 * - Depois do resultado, a próxima ronda abre sozinha.
 *
 * Para o multiplayer, cria um hook paralelo com a mesma forma de retorno
 * e reutiliza os mesmos componentes.
 */
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

    // Refs: bloqueiam chamadas duplicadas (o estado do React é assíncrono).
    const submittingRef = useRef(false);
    const advancingRef = useRef(false);
    const timeUpRoundRef = useRef(null);
    const deadlineRef = useRef(null);
    const latestRef = useRef({});

    // Aplica o estado vindo do servidor (também restaura após refresh).
    const applyStatus = useCallback((data) => {
        setStatus(data);
        setAdvanceFailed(false);

        const rounds = data.rounds || [];
        const current = rounds[rounds.length - 1];

        if (current?.is_answered) {
            deadlineRef.current = null;

            setRoundResult({
                round_id: current.id,
                distance_km: current.distance_km,
                score: current.score,
                correct_location: current.correct_location,
                timed_out: current.guessed_latitude == null,
            });
            setSelectedLocation(
                toLocation(current.guessed_latitude, current.guessed_longitude)
            );
        } else {
            const remaining =
                current?.seconds_remaining ??
                data.time_limit_seconds ??
                DEFAULT_TIME_LIMIT;

            deadlineRef.current = Date.now() + remaining * 1000;

            setSecondsLeft(Math.ceil(remaining));
            setRoundResult(null);
            setSelectedLocation(null);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setIsLoading(true);
                setLoadError(false);

                const data = await (sessionId);

                if (!cancelled) applyStatus(data);
            } catch (error) {
                console.error("Erro ao carregar a partida:", error);
                if (!cancelled) setLoadError(true);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [sessionId, applyStatus]);

    const rounds = status?.rounds ?? [];
    const round = rounds.length ? rounds[rounds.length - 1] : null;
    const totalRounds = status?.progress?.total_rounds ?? rounds.length;
    const totalScore = status?.total_score ?? 0;
    const timeLimit = status?.time_limit_seconds ?? DEFAULT_TIME_LIMIT;
    const isFinished = Boolean(status?.is_finished);
    const isLastRound = round ? round.number >= totalRounds : false;

    // ---------- Fechar a ronda (palpite ou timeout) ----------
    const finishRound = useCallback(
        async (request) => {
            if (!round || roundResult || submittingRef.current) return false;

            submittingRef.current = true;
            setIsSubmitting(true);

            try {
                const result = await request(round.id);

                deadlineRef.current = null;

                setRoundResult(result);
                setSelectedLocation(
                    toLocation(result.guessed_latitude, result.guessed_longitude)
                );

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
                                      prev.progress.answered_rounds + 1,
                              },
                              rounds: prev.rounds.map((r) =>
                                  r.id === result.round_id
                                      ? {
                                            ...r,
                                            is_answered: true,
                                            seconds_remaining: null,
                                            score: result.score,
                                            distance_km: result.distance_km,
                                            timed_out: result.timed_out,
                                            correct_location:
                                                result.correct_location,
                                            guessed_latitude:
                                                result.guessed_latitude,
                                            guessed_longitude:
                                                result.guessed_longitude,
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

    const submitGuess = useCallback(() => {
        if (!selectedLocation) {
            toast.error("Selecciona primeiro uma localização no mapa.");
            return Promise.resolve(false);
        }

        return finishRound((roundId) =>
            submitGameAnswer(roundId, selectedLocation)
        );
    }, [selectedLocation, finishRound]);

    // O tempo acabou: envia o palpite escolhido, ou fecha a ronda sem palpite.
    const handleTimeUp = useCallback(async () => {
        if (!round || roundResult) return;
        if (timeUpRoundRef.current === round.id) return;

        timeUpRoundRef.current = round.id;

        const ok = selectedLocation
            ? await finishRound((roundId) =>
                  submitGameAnswer(roundId, selectedLocation)
              )
            : await finishRound((roundId) => timeoutRound(roundId));

        // Se falhou (rede), permite nova tentativa passados 2s.
        if (!ok) {
            setTimeout(() => {
                timeUpRoundRef.current = null;
            }, 2000);
        }
    }, [round, roundResult, selectedLocation, finishRound]);

    // ---------- Avançar ----------
    const goToNextRound = useCallback(async () => {
        if (advancingRef.current) return;

        advancingRef.current = true;
        setIsAdvancing(true);
        setAdvanceFailed(false);

        try {
            await startNextRound(sessionId);

            const fresh = await (sessionId);
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
    }, [sessionId, applyStatus]);

    // Handlers mais recentes, usados pelos temporizadores.
    latestRef.current = { handleTimeUp, goToNextRound };

    // ---------- Contagem decrescente da ronda ----------
    useEffect(() => {
        if (!round || roundResult || isFinished) return undefined;

        function tick() {
            if (deadlineRef.current == null) return;

            const left = Math.max(
                0,
                Math.ceil((deadlineRef.current - Date.now()) / 1000)
            );

            setSecondsLeft(left);

            if (left <= 0) latestRef.current.handleTimeUp();
        }

        tick();
        const id = setInterval(tick, 250);

        return () => clearInterval(id);
    }, [round?.id, roundResult, isFinished]); // eslint-disable-line react-hooks/exhaustive-deps

    // ---------- Avanço automático depois do resultado ----------
    useEffect(() => {
        if (!round || !roundResult || isFinished) return undefined;

        let left = RESULT_DISPLAY_SECONDS;
        setResultCountdown(left);

        const id = setInterval(() => {
            left -= 1;
            setResultCountdown(Math.max(0, left));

            if (left <= 0) {
                clearInterval(id);
                latestRef.current.goToNextRound();
            }
        }, 1000);

        return () => clearInterval(id);
    }, [round?.id, roundResult, isFinished]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        // dados
        round,
        rounds,
        totalRounds,
        totalScore,
        timeLimit,
        selectedLocation,
        roundResult,

        // tempo
        secondsLeft,
        resultCountdown,

        // estado
        isLoading,
        loadError,
        isSubmitting,
        isAdvancing,
        advanceFailed,
        isFinished,
        isLastRound,

        // acções
        setSelectedLocation,
        submitGuess,
        goToNextRound, // só usado como "tentar novamente" se o avanço falhar
    };
}