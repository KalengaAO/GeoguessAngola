import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
    endQuizSession,
    getQuizQuestions,
    submitQuizAnswer,
} from "../../services/quizService";
import { getApiErrorMessage } from "../../utils/apiErrors";
import "./QuizPage.css";

function QuizPage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [questionIndex, setQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [answerResult, setAnswerResult] = useState(null);
    const [score, setScore] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [emptyEndFailed, setEmptyEndFailed] = useState(false);
    const emptyEndStarted = useRef(false);

    const questionsQuery = useQuery({
        queryKey: ["quiz", "questions", sessionId],
        queryFn: ({ signal }) => getQuizQuestions(sessionId, { signal }),
        retry: false,
    });
    const questions = questionsQuery.data ?? [];
    const question = questions[questionIndex];

    useEffect(() => {
        if (
            !questionsQuery.isSuccess ||
            questions.length > 0 ||
            isFinished ||
            isEnding ||
            emptyEndFailed ||
            emptyEndStarted.current
        ) {
            return;
        }

        emptyEndStarted.current = true;
        setIsEnding(true);
        endQuizSession(sessionId)
            .then(() => setIsFinished(true))
            .catch((error) => {
                setEmptyEndFailed(true);
                toast.error(getApiErrorMessage(error, "Não foi possível terminar o quiz."));
            })
            .finally(() => setIsEnding(false));
    }, [emptyEndFailed, isEnding, isFinished, questions.length, questionsQuery.isSuccess, sessionId]);

    async function handleAnswer() {
        if (!selectedOption || !question || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const result = await submitQuizAnswer(
                sessionId,
                question.id,
                selectedOption
            );
            setAnswerResult(result);
            if (result.is_correct) setScore((current) => current + 1);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Não foi possível submeter a resposta."));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleContinue() {
        if (questionIndex < questions.length - 1) {
            setQuestionIndex((current) => current + 1);
            setSelectedOption(null);
            setAnswerResult(null);
            return;
        }

        setIsEnding(true);
        try {
            await endQuizSession(sessionId);
            setIsFinished(true);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Não foi possível terminar o quiz."));
        } finally {
            setIsEnding(false);
        }
    }

    async function handleQuit() {
        setIsEnding(true);
        try {
            await endQuizSession(sessionId);
            navigate("/games", { replace: true });
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Não foi possível terminar o quiz."));
        } finally {
            setIsEnding(false);
        }
    }

    if (questionsQuery.isLoading) {
        return <main className="quiz-page"><p role="status">A preparar o quiz...</p></main>;
    }

    if (questionsQuery.isError) {
        return (
            <main className="quiz-page">
                <Card className="quiz-page__panel">
                    <h1>Quiz indisponível</h1>
                    <p>Não foi possível carregar as perguntas desta sessão.</p>
                    <Button asChild variant="outline"><Link to="/games">Voltar aos jogos</Link></Button>
                </Card>
            </main>
        );
    }

    if (!isFinished && questions.length === 0) {
        return (
            <main className="quiz-page">
                <Card className="quiz-page__panel">
                    <p role={emptyEndFailed ? "alert" : "status"}>
                        {emptyEndFailed
                            ? "Não foi possível encerrar o quiz vazio."
                            : "A preparar o resultado..."}
                    </p>
                    {emptyEndFailed && (
                        <Button
                            onClick={() => {
                                emptyEndStarted.current = false;
                                setEmptyEndFailed(false);
                            }}
                            disabled={isEnding}
                        >
                            Tentar novamente
                        </Button>
                    )}
                </Card>
            </main>
        );
    }

    if (isFinished) {
        return (
            <main className="quiz-page">
                <Card className="quiz-page__panel quiz-page__result">
                    <Badge variant="gold"><BookOpenCheck size={13} /> QUIZ CONCLUÍDO</Badge>
                    <h1>Muito bem, explorador!</h1>
                    <p>
                        {`Acertaste ${score} de ${questions.length} perguntas.`}
                    </p>
                    <Button asChild><Link to="/games">Jogar novamente</Link></Button>
                </Card>
            </main>
        );
    }

    return (
        <main className="quiz-page">
            <header className="quiz-page__topbar">
                <Button variant="ghost" onClick={handleQuit} disabled={isEnding}>
                    <ArrowLeft /> Sair do quiz
                </Button>
                <BrandLogo className="quiz-page__brand" compact />
                <div className="quiz-page__topbar-stats">
                    <Badge variant="outline">{questionIndex + 1} / {questions.length}</Badge>
                    <Badge variant="gold">{score} acertos</Badge>
                </div>
            </header>
            <div
                className="quiz-page__progress"
                role="progressbar"
                aria-label="Progresso do quiz"
                aria-valuemin={1}
                aria-valuemax={questions.length}
                aria-valuenow={questionIndex + 1}
            >
                <span
                    style={{
                        width: `${((questionIndex + 1) / questions.length) * 100}%`,
                    }}
                />
            </div>
            <Card className="quiz-page__panel">
                <div className="quiz-page__meta">
                    <Badge variant="gold">{question.category === "province" ? "PROVÍNCIAS" : "GEOGRAFIA"}</Badge>
                    {question.province && <span>{question.province}</span>}
                </div>
                <h1>{question.question}</h1>
                <div className="quiz-page__options">
                    {question.options.map((option, index) => {
                        const isCorrect = answerResult?.correct_option_id === option.id;
                        const isWrong = answerResult?.selected_option_id === option.id && !answerResult.is_correct;
                        return (
                            <button
                                className={`quiz-page__option${selectedOption === option.id ? " is-selected" : ""}${isCorrect ? " is-correct" : ""}${isWrong ? " is-wrong" : ""}`}
                                key={option.id}
                                type="button"
                                onClick={() => !answerResult && setSelectedOption(option.id)}
                                disabled={Boolean(answerResult)}
                            >
                                <span className="quiz-page__option-letter">{String.fromCharCode(65 + index)}</span>
                                <span>{option.text}</span>
                                {isCorrect && <Check size={18} />}
                                {isWrong && <X size={18} />}
                            </button>
                        );
                    })}
                </div>
                {answerResult?.explanation && (
                    <p className="quiz-page__explanation">{answerResult.explanation}</p>
                )}
                <footer className="quiz-page__actions">
                    {!answerResult ? (
                        <Button onClick={handleAnswer} disabled={!selectedOption || isSubmitting}>
                            {isSubmitting ? "A verificar..." : "Confirmar resposta"}
                        </Button>
                    ) : (
                        <Button onClick={handleContinue} disabled={isEnding}>
                            {isEnding ? "A terminar..." : questionIndex === questions.length - 1 ? "Ver resultado" : "Próxima pergunta"}
                            <ArrowRight />
                        </Button>
                    )}
                </footer>
            </Card>
        </main>
    );
}

export default QuizPage;
