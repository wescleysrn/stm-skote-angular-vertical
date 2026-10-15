import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/**
 * Ajuste para o seu environment, por exemplo:
 *   import { environment } from 'src/environments/environment';
 *   const API_URL = environment.apiUrl;
 * (o prefixo "/api" já é adicionado abaixo)
 */
const API_URL = 'http://localhost:8080';

/* ------------------------------------------------------------------ */
/* Modelos (espelham os DTOs do /v3/api-docs)                          */
/* ------------------------------------------------------------------ */
export interface Regiao {
  sigla: string;
  nome: string;
}

export interface UnidadeFederacao {
  codigoIBGE: string;
  sigla: string;
  nome: string;
  idSei?: number;
  regiao?: Regiao;
}

export interface MesoRegiao {
  codigoIBGECompleto: string;
  codigoIBGE: string;
  nome: string;
  uf?: UnidadeFederacao;
  microRegiaos?: MicroRegiao[];
}

export interface MicroRegiao {
  codigoIBGECompleto: string;
  codigoIBGE: string;
  nome: string;
  mesoRegiao?: MesoRegiao;
}

export interface Municipio {
  codigoIBGECompleto: string;
  codigoIBGE: string;
  nome: string;
  idSei?: number;
  microRegiao?: MicroRegiao;
  uf?: UnidadeFederacao;
}

export interface Distrito {
  codigoIBGECompleto: string;
  codigoIBGE: string;
  nome: string;
  municipio?: Municipio;
  subDistritos?: SubDistrito[];
}

export interface SubDistrito {
  codigoIBGECompleto: string;
  codigoIBGE: string;
  nome: string;
  distrito?: Distrito;
}

/* ------------------------------------------------------------------ */
/* Service                                                             */
/* ------------------------------------------------------------------ */
@Injectable({ providedIn: 'root' })
export class LocalizacaoIbgeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api`;

  /** Endpoints de lista: HTTP 204 chega como body null -> devolvemos []. */
  private lista<T>(url: string): Observable<T[]> {
    return this.http.get<T[] | null>(url).pipe(map((r) => r ?? []));
  }

  /** Endpoints de item único: HTTP 204 -> null. */
  private item<T>(url: string): Observable<T | null> {
    return this.http.get<T | null>(url);
  }

  private enc(v: string): string {
    return encodeURIComponent(v);
  }

  /* ----- Região ----- */
  regioes() {
    return this.lista<Regiao>(`${this.base}/regiao`);
  }
  regiaoPorSigla(sigla: string) {
    return this.item<Regiao>(`${this.base}/regiao/sigla/${this.enc(sigla)}`);
  }
  regiaoPorNome(nome: string) {
    return this.item<Regiao>(`${this.base}/regiao/nome/${this.enc(nome)}`);
  }

  /* ----- UF ----- */
  ufs() {
    return this.lista<UnidadeFederacao>(`${this.base}/uf`);
  }
  ufPorCodigo(codigoIBGE: string) {
    return this.item<UnidadeFederacao>(`${this.base}/uf/${this.enc(codigoIBGE)}`);
  }
  ufsPorRegiao(siglaRegiao: string) {
    return this.lista<UnidadeFederacao>(`${this.base}/uf/regiao/${this.enc(siglaRegiao)}`);
  }

  /* ----- Mesorregião ----- */
  mesoPorCodigo(codigoIBGE: string) {
    return this.item<MesoRegiao>(`${this.base}/mesoregiao/${this.enc(codigoIBGE)}`);
  }
  mesosPorUf(sigla: string) {
    return this.lista<MesoRegiao>(`${this.base}/mesoregiao/uf/${this.enc(sigla)}`);
  }
  mesosPorRegiao(siglaRegiao: string) {
    return this.lista<MesoRegiao>(`${this.base}/mesoregiao/regiao/${this.enc(siglaRegiao)}`);
  }
  mesoPorMunicipio(codigoIBGE: string) {
    return this.item<MesoRegiao>(`${this.base}/mesoregiao/municipio/${this.enc(codigoIBGE)}`);
  }

  /* ----- Microrregião ----- */
  microPorCodigo(codigoIBGE: string) {
    return this.item<MicroRegiao>(`${this.base}/microregiao/${this.enc(codigoIBGE)}`);
  }
  microsPorUf(sigla: string) {
    return this.lista<MicroRegiao>(`${this.base}/microregiao/uf/${this.enc(sigla)}`);
  }
  microsPorRegiao(siglaRegiao: string) {
    return this.lista<MicroRegiao>(`${this.base}/microregiao/regiao/${this.enc(siglaRegiao)}`);
  }
  microsPorMeso(codigoIBGE: string) {
    return this.lista<MicroRegiao>(`${this.base}/microregiao/mesoregiao/${this.enc(codigoIBGE)}`);
  }

  /* ----- Município ----- */
  municipioPorCodigo(codigoIBGE: string) {
    return this.item<Municipio>(`${this.base}/municipio/${this.enc(codigoIBGE)}`);
  }
  municipiosPorUf(sigla: string) {
    return this.lista<Municipio>(`${this.base}/municipio/uf/${this.enc(sigla)}`);
  }
  municipiosPorRegiao(siglaRegiao: string) {
    return this.lista<Municipio>(`${this.base}/municipio/regiao/${this.enc(siglaRegiao)}`);
  }
  municipiosPorMicro(codigoIBGE: string) {
    return this.lista<Municipio>(`${this.base}/municipio/microregiao/${this.enc(codigoIBGE)}`);
  }
  municipiosPorMeso(codigoIBGE: string) {
    return this.lista<Municipio>(`${this.base}/municipio/mesoregiao/${this.enc(codigoIBGE)}`);
  }

  /* ----- Distrito ----- */
  distritoPorCodigo(codigoIBGE: string) {
    return this.item<Distrito>(`${this.base}/distrito/${this.enc(codigoIBGE)}`);
  }
  distritosPorMunicipio(codigoIBGE: string) {
    return this.lista<Distrito>(`${this.base}/distrito/municipio/${this.enc(codigoIBGE)}`);
  }

  /* ----- Subdistrito ----- */
  subdistritoPorCodigo(codigoIBGE: string) {
    return this.item<SubDistrito>(`${this.base}/subdistrito/${this.enc(codigoIBGE)}`);
  }
  subdistritosPorMunicipio(codigoIBGE: string) {
    return this.lista<SubDistrito>(`${this.base}/subdistrito/municipio/${this.enc(codigoIBGE)}`);
  }
  subdistritosPorDistrito(codigoIBGE: string) {
    return this.lista<SubDistrito>(`${this.base}/subdistrito/distrito/${this.enc(codigoIBGE)}`);
  }

}
