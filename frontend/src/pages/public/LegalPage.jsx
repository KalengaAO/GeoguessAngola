import { Link } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../hooks/useAuth";
import "./LegalPage.css";

const legalDocuments = {
    privacy: {
        eyebrow: "TRANSPARÊNCIA E DADOS",
        title: "Política de Privacidade",
        intro:
            "Esta política explica que dados o GeoGuess Angola trata, para que os utiliza e como podes exercer controlo sobre eles. Aplica-se à utilização do site, das contas e dos modos de jogo.",
        sections: [
            {
                id: "responsavel",
                title: "1. Responsável pelo tratamento",
                paragraphs: [
                    "O GeoGuess Angola é um projecto educativo. O responsável pelos dados tratados numa instalação é a equipa ou entidade que opera essa instalação. Na versão do projecto publicada neste repositório, os responsáveis podem ser contactados através do repositório do GeoGuess Angola.",
                ],
            },
            {
                id: "dados-tratados",
                title: "2. Dados tratados",
                paragraphs: [
                    "Ao criares uma conta, tratamos o nome de utilizador e a palavra-passe. A palavra-passe é gerida pelo sistema de autenticação do Django e não é guardada como texto simples. No perfil podes acrescentar um endereço de email, uma biografia e um avatar.",
                    "Para prestar os jogos, guardamos os palpites de coordenadas que submetes no mapa, as distâncias e pontuações, o progresso e o histórico das partidas, bem como as respostas e pontuações dos quizzes. As coordenadas são escolhidas por ti para responder ao desafio; o site não precisa de aceder ao GPS do teu dispositivo.",
                    "Para as funcionalidades sociais e multiplayer, tratamos pedidos de amizade, convites, participação e estado de salas, disponibilidade dos jogadores e resultados das partidas.",
                    "Os pedidos à aplicação e aos serviços de infraestrutura podem envolver dados técnicos necessários à comunicação e segurança, como endereço IP, data/hora e informação do navegador. A infraestrutura concreta depende de quem opera a instalação do serviço.",
                ],
            },
            {
                id: "finalidades",
                title: "3. Para que usamos os dados",
                paragraphs: [
                    "Usamos os dados para autenticar a tua conta, apresentar o perfil e as classificações, guardar o progresso, calcular resultados, permitir partidas multiplayer, gerir amizades e convites e proteger a integridade do serviço.",
                    "O tratamento é necessário para disponibilizar as funcionalidades que pedes ao usar a aplicação. Os dados opcionais do perfil são usados para apresentar o perfil conforme a tua utilização. Também podemos tratar informação técnica para prevenir abuso, investigar falhas e manter o serviço seguro, de acordo com a legislação aplicável.",
                ],
            },
            {
                id: "visibilidade",
                title: "4. O que outros jogadores podem ver",
                paragraphs: [
                    "O nome de utilizador e as estatísticas associadas podem aparecer na classificação e nas funcionalidades sociais. Se preencheres o perfil, a biografia e o avatar podem ser apresentados no perfil público dentro da comunidade.",
                    "Nas salas multiplayer, os participantes podem ver os nomes de utilizador, o estado da sala e os resultados necessários para acompanhar a partida. Os palpites são tratados para calcular a pontuação e apresentar o resultado da ronda.",
                ],
            },
            {
                id: "partilha",
                title: "5. Partilha e serviços externos",
                paragraphs: [
                    "Não vendemos os teus dados pessoais nem os usamos para publicidade comportamental. O acesso é limitado ao necessário para operar a aplicação e às pessoas que usam as funcionalidades sociais ou multiplayer.",
                    "A aplicação depende de serviços de infraestrutura configurados pelo operador, como alojamento, base de dados e armazenamento de imagens. Esses fornecedores podem processar dados apenas para disponibilizar e manter o serviço.",
                    "Os mapas usam tiles do OpenStreetMap. O teu navegador liga-se aos servidores que fornecem esses mapas; essa ligação pode revelar ao fornecedor dados técnicos como o endereço IP e o navegador. O pedido de tiles não inclui o teu nome de utilizador ou as respostas do jogo. A atribuição do OpenStreetMap é apresentada no mapa.",
                ],
            },
            {
                id: "armazenamento",
                title: "6. Armazenamento, sessão e segurança",
                paragraphs: [
                    "Os dados de conta e jogo são armazenados no servidor da aplicação. Os tokens de autenticação do navegador são guardados em sessionStorage e removidos quando terminas sessão; evita usar uma sessão autenticada num dispositivo partilhado.",
                    "Aplicamos controlos de autenticação e autorização e medidas técnicas adequadas à aplicação. Nenhum serviço ligado à Internet pode garantir segurança absoluta; mantém a tua palavra-passe privada e informa os responsáveis se suspeitares de acesso indevido.",
                ],
            },
            {
                id: "retencao",
                title: "7. Conservação e eliminação",
                paragraphs: [
                    "Mantemos os dados enquanto forem necessários para manter a conta, o histórico de jogo, as classificações e as funcionalidades sociais, ou pelo período exigido por obrigações legais e de segurança.",
                    "Podes pedir a eliminação da conta e dos dados associados. A eliminação dos registos activos depende das relações entre dados e da infraestrutura que opera o serviço; cópias de segurança e registos técnicos podem permanecer durante os ciclos normais de retenção e não ficam imediatamente acessíveis na aplicação.",
                ],
            },
            {
                id: "direitos",
                title: "8. Os teus direitos e escolhas",
                paragraphs: [
                    "Podes consultar e actualizar os dados editáveis do perfil na aplicação. Nos termos da legislação de protecção de dados aplicável, podes também solicitar acesso, correcção ou eliminação dos teus dados e colocar questões sobre o respectivo tratamento.",
                    "Para um pedido individual, contacta os responsáveis através do repositório do projecto e pede um canal privado. Não publiques palavras-passe, endereços de email, identificadores de conta ou outros dados pessoais em áreas públicas.",
                ],
            },
            {
                id: "alteracoes",
                title: "9. Alterações a esta política",
                paragraphs: [
                    "Podemos actualizar esta política quando as funcionalidades ou as práticas de tratamento mudarem. A versão publicada nesta página indica a data da última revisão. Alterações relevantes devem ser comunicadas na aplicação ou no repositório do projecto.",
                ],
            },
        ],
    },
    terms: {
        eyebrow: "REGRAS DE UTILIZAÇÃO",
        title: "Termos de Serviço",
        intro:
            "Estes termos explicam as regras de utilização do GeoGuess Angola, uma aplicação de aprendizagem e entretenimento sobre geografia e lugares de Angola. Ao criares uma conta ou utilizares as funcionalidades autenticadas, concordas com estas regras.",
        sections: [
            {
                id: "servico",
                title: "1. O serviço",
                paragraphs: [
                    "O GeoGuess Angola disponibiliza desafios geográficos individuais, quizzes, perfis, classificações, amizades, salas e partidas multiplayer. O serviço pode ser actualizado, alterado ou temporariamente interrompido para manutenção, segurança ou evolução do projecto.",
                    "As localizações, imagens, perguntas e pontuações destinam-se a fins educativos e recreativos. As respostas e classificações não constituem informação oficial de navegação, cartografia ou aconselhamento.",
                ],
            },
            {
                id: "conta",
                title: "2. Conta e segurança",
                paragraphs: [
                    "És responsável por proteger as credenciais da tua conta e pelas acções realizadas através dela. Não partilhes a palavra-passe nem tentes aceder à conta de outra pessoa.",
                    "Mantém os dados do perfil apropriados e não uses nomes, biografias ou imagens para te fazer passar por outra pessoa, divulgar dados privados ou infringir direitos de terceiros.",
                ],
            },
            {
                id: "conduta",
                title: "3. Conduta e jogo justo",
                paragraphs: [
                    "Ao usar a aplicação, concordas em respeitar os outros jogadores e a integridade dos jogos. Não podes:",
                ],
                items: [
                    "assediar, ameaçar, discriminar ou publicar conteúdo ilegal, abusivo ou que viole a privacidade de terceiros;",
                    "usar bots, automatização, exploração de falhas ou outros meios para manipular palpites, resultados, classificações ou convites;",
                    "interferir no funcionamento, tentar contornar controlos de segurança ou aceder a dados e salas sem autorização;",
                    "enviar pedidos ou convites de forma abusiva, ou carregar imagens e textos sem os direitos necessários.",
                ],
            },
            {
                id: "multiplayer",
                title: "4. Salas e funcionalidades multiplayer",
                paragraphs: [
                    "As salas podem mostrar aos participantes o nome de utilizador, a prontidão, o estado da partida e os resultados necessários para jogar em conjunto. Usa códigos de sala e convites apenas com pessoas que pretendes convidar.",
                    "Cada participante deve submeter os seus próprios palpites e respeitar os limites de tempo e as regras da partida. O anfitrião pode iniciar ou avançar rondas conforme as regras apresentadas na aplicação.",
                ],
            },
            {
                id: "conteudo",
                title: "5. Conteúdo enviado pelos utilizadores",
                paragraphs: [
                    "Continuas responsável pela biografia e pelas imagens que adicionas ao perfil. Ao submetê-las, autorizas o GeoGuess Angola a armazená-las, reproduzi-las e apresentá-las dentro do serviço apenas na medida necessária para operar o perfil e as funcionalidades sociais.",
                    "Garante que tens autorização para usar o conteúdo e que este não viola direitos de autor, marcas, privacidade ou outros direitos. Podemos remover conteúdo que viole estes termos ou que coloque utilizadores ou o serviço em risco.",
                ],
            },
            {
                id: "propriedade",
                title: "6. Propriedade intelectual e mapas",
                paragraphs: [
                    "A aplicação, a sua identidade visual e os conteúdos do projecto pertencem aos respectivos titulares ou são usados sob licença. Estes termos não transferem a sua propriedade para os utilizadores.",
                    "Os mapas são fornecidos com atribuição ao OpenStreetMap e podem estar sujeitos às condições e licenças desse projecto e dos fornecedores de tiles. Respeita a atribuição apresentada na aplicação.",
                ],
            },
            {
                id: "suspensao",
                title: "7. Suspensão e encerramento",
                paragraphs: [
                    "Podemos limitar ou suspender o acesso quando houver violação destes termos, risco para a segurança, manipulação de resultados ou obrigação legal. Sempre que razoavelmente possível, a decisão será proporcional à situação.",
                    "Podes deixar de usar o serviço e solicitar o encerramento da conta. A eliminação de registos pode estar sujeita a obrigações legais, segurança e prazos de cópias de segurança, conforme explicado na Política de Privacidade.",
                ],
            },
            {
                id: "responsabilidade",
                title: "8. Disponibilidade e responsabilidade",
                paragraphs: [
                    "O serviço é disponibilizado no estado em que se encontra e pode conter erros, indisponibilidade ou conteúdo geográfico incompleto. Procuramos corrigir problemas, mas não garantimos funcionamento ininterrupto ou que todas as respostas representem uma fonte oficial.",
                    "Na medida permitida pela legislação aplicável, o projecto não se responsabiliza por interrupções de serviços externos, perdas causadas por utilização indevida da conta ou decisões tomadas com base em conteúdo recreativo do jogo. Nada nestes termos exclui direitos que a lei não permita excluir.",
                ],
            },
            {
                id: "alteracoes",
                title: "9. Alterações e lei aplicável",
                paragraphs: [
                    "Estes termos podem ser actualizados quando o serviço ou as obrigações legais mudarem. A data no início da página identifica a revisão actual; a continuação da utilização após uma alteração significa que aceitas os termos actualizados, salvo quando a lei exigir outro procedimento.",
                    "Estes termos são interpretados de acordo com a legislação aplicável na República de Angola, sem prejuízo de normas imperativas que protejam o utilizador.",
                ],
            },
        ],
    },
};

function LegalPage({ documentType }) {
    const document = legalDocuments[documentType];
    const { isAuthenticated } = useAuth();
    const homePath = isAuthenticated ? "/games" : "/";
    const otherDocument =
        documentType === "privacy"
            ? {
                  path: "/terms-of-service",
                  label: "Termos de Serviço",
              }
            : {
                  path: "/privacy-policy",
                  label: "Política de Privacidade",
              };

    return (
        <>
            <main className="legal-page" aria-labelledby="legal-page-title">
                <header className="legal-page__header">
                    <BrandLogo
                        to={homePath}
                        className="legal-page__brand"
                        compact
                    />
                    <nav
                        className="legal-page__navigation"
                        aria-label="Navegação legal"
                    >
                        <Link to={otherDocument.path}>
                            {otherDocument.label}
                        </Link>
                        <Link to={homePath}>
                            {isAuthenticated ? "Voltar aos jogos" : "Início"}
                        </Link>
                    </nav>
                </header>

                <article className="legal-page__article">
                    <span className="legal-page__eyebrow">
                        {document.eyebrow}
                    </span>
                    <h1 id="legal-page-title">{document.title}</h1>
                    <p className="legal-page__intro">{document.intro}</p>
                    <p className="legal-page__updated">
                        Última actualização:{" "}
                        <time dateTime="2026-11-26">
                            26 de Novembro de 2026
                        </time>
                    </p>

                    <nav
                        className="legal-page__contents"
                        aria-label={`Conteúdo: ${document.title}`}
                    >
                        <h2>Nesta página</h2>
                        <ol>
                            {document.sections.map((section) => (
                                <li key={section.id}>
                                    <a href={`#${section.id}`}>
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>

                    {document.sections.map((section) => (
                        <section
                            className="legal-page__section"
                            id={section.id}
                            key={section.id}
                            aria-labelledby={`${section.id}-title`}
                        >
                            <h2 id={`${section.id}-title`}>
                                {section.title}
                            </h2>
                            {section.paragraphs.map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                            {section.items && (
                                <ul>
                                    {section.items.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}

                    <aside className="legal-page__contact">
                        <h2>Contacto sobre estas páginas</h2>
                        <p>
                            Para dúvidas ou pedidos relativos a estes
                            documentos, consulta o{" "}
                            <a
                                href="https://github.com/KalengaAO/GeoguessAngola"
                                target="_blank"
                                rel="noreferrer"
                            >
                                repositório do GeoGuess Angola
                            </a>{" "}
                            e contacta os responsáveis pelo projecto. Não
                            publiques palavras-passe, emails ou outros dados
                            pessoais em espaços públicos.
                        </p>
                    </aside>
                </article>
            </main>
            <Footer />
        </>
    );
}

export default LegalPage;
