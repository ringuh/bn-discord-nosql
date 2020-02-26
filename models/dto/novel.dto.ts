import { AuthorDTO } from "./author.dto";
import { GenreDTO } from "./genre.dto"
import { SourceDTO } from "./source.dto";

import { BookStrategyDTO } from "./bookStrategy.dto";
import { LastChapterDTO } from "./lastChapter.dto";

export interface NovelDTO {
    author: AuthorDTO;
    lastChapter: LastChapterDTO;
    source: SourceDTO;
    publisher?: any;
    genres: GenreDTO[];
    genreIds: string[];
    chapterCount: number;
    translator?: any;
    bookStrategy: BookStrategyDTO;
    bookStopNotice?: any;
    isShowStrategy: boolean;
    isPay: boolean;
    enabledProofReading: boolean;
    promotion?: any;
    authorId: string;
    isCopyrightAuthorized: string;
    cover: string;
    volume?: any;
    editorId?: any;
    name: string;
    originRefId: string;
    publisherId?: any;
    publishTime: Date;
    synopsis: string;
    tag: string;
    translatorId?: any;
    enSerial?: any;
    status: number;
    alias: string;
    canonicalName: string;
    cnName: string;
    copyright: string;
    historyCanonicalName: string;
    serial?: any;
    subTitle: string;
    ratingNum: number;
    releasedChapterCount: number;
    cpEnCompanyName: string;
    corpusBookId: number;
    sensitivityRating: string;
    updateTime: Date;
    createTime: Date;
    id: string;
}