import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { finalize, forkJoin } from 'rxjs';

import {
  Distrito,
  LocalizacaoIbgeService,
  Municipio,
  Regiao,
  SubDistrito,
  UnidadeFederacao,
} from '../../../services/ibge/ibge.service';

const normaliza = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

@Component({
  selector: 'app-default',
  standalone: true,
  imports: [FormsModule, NgSelectComponent],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss'],
})
export class DefaultComponent implements OnInit {
  private readonly api = inject(LocalizacaoIbgeService);
  private readonly destroyRef = inject(DestroyRef);

  /* ---------- dados ---------- */
  regioes = signal<Regiao[]>([]);
  ufs = signal<UnidadeFederacao[]>([]);
  municipios = signal<Municipio[]>([]);
  qtdMeso = signal(0);
  qtdMicro = signal(0);

  /* ---------- seleção ---------- */
  regiaoSel = signal<string | null>(null);
  ufSel = signal<string | null>(null);
  municipioSel = signal<string | null>(null);

  /* ---------- detalhe do município ---------- */
  detalhe = signal<Municipio | null>(null);
  distritos = signal<Distrito[]>([]);
  subdistritos = signal<Record<string, SubDistrito[]>>({});
  distritoAberto = signal<string | null>(null);
  loadingSub = signal<string | null>(null);

  /* ---------- estado de tela ---------- */
  loadingUfs = signal(false);
  loadingMun = signal(false);
  loadingDetalhe = signal(false);
  erro = signal<string | null>(null);

  /* ---------- busca por código ---------- */
  codigoBusca = '';

  /* ---------- tabela de municípios ---------- */
  filtro = signal('');
  pagina = signal(1);
  readonly pageSize = 10;

  filtrados = computed(() => {
    const f = normaliza(this.filtro());
    const lista = this.municipios();
    return f
      ? lista.filter((m) => normaliza(m.nome).includes(f) || m.codigoIBGE.includes(f))
      : lista;
  });
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.pageSize)));
  paginados = computed(() => {
    const ini = (this.pagina() - 1) * this.pageSize;
    return this.filtrados().slice(ini, ini + this.pageSize);
  });

  ufAtual = computed(() => this.ufs().find((u) => u.sigla === this.ufSel()) ?? null);

  ngOnInit(): void {
    this.api.regioes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (r) => this.regioes.set(r),
      error: (e) => this.falha('Não foi possível carregar as regiões.', e),
    });
    this.carregarUfs(null);
  }

  /* ================== Região / UF / Município ================== */
  onRegiaoChange(sigla: string | null): void {
    this.regiaoSel.set(sigla);
    this.limparUf();
    this.carregarUfs(sigla);
  }

  onUfChange(sigla: string | null): void {
    this.ufSel.set(sigla);
    this.limparMunicipio();
    this.municipios.set([]);
    this.qtdMeso.set(0);
    this.qtdMicro.set(0);
    this.filtro.set('');
    this.pagina.set(1);
    if (sigla) this.carregarUf(sigla);
  }

  onMunicipioChange(codigo: string | null): void {
    this.municipioSel.set(codigo);
    if (codigo) this.carregarMunicipio(codigo);
    else this.limparMunicipio();
  }

  selecionarDaTabela(m: Municipio): void {
    this.onMunicipioChange(m.codigoIBGE);
  }

  /* ================== Distritos / Subdistritos ================== */
  toggleDistrito(d: Distrito): void {
    const cod = d.codigoIBGE;
    if (this.distritoAberto() === cod) {
      this.distritoAberto.set(null);
      return;
    }
    this.distritoAberto.set(cod);
    if (this.subdistritos()[cod]) return; // já carregado (cache)

    this.loadingSub.set(cod);
    this.api
      .subdistritosPorDistrito(cod)
      .pipe(finalize(() => this.loadingSub.set(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (subs) => this.subdistritos.update((s) => ({ ...s, [cod]: subs })),
        error: (e) => this.falha('Não foi possível carregar os subdistritos.', e),
      });
  }

  /* ================== Busca por código IBGE ================== */
  buscarPorCodigo(): void {
    const cod = this.codigoBusca.trim();
    if (!cod) return;
    this.erro.set(null);
    this.loadingDetalhe.set(true);

    this.api
      .municipioPorCodigo(cod)
      .pipe(finalize(() => this.loadingDetalhe.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (m) => {
          if (!m) {
            this.erro.set(`Nenhum município encontrado para o código ${cod}.`);
            return;
          }
          // sincroniza os filtros com o município encontrado
          const sigla = m.uf?.sigla ?? null;
          this.regiaoSel.set(m.uf?.regiao?.sigla ?? null);
          this.ufSel.set(sigla);
          this.municipioSel.set(m.codigoIBGE);
          if (sigla) this.carregarUf(sigla);
          this.carregarMunicipio(m.codigoIBGE);
        },
        error: (e) => this.falha(`Código ${cod} inválido ou não encontrado.`, e),
      });
  }

  /* ================== Paginação ================== */
  onFiltro(v: string): void {
    this.filtro.set(v);
    this.pagina.set(1);
  }
  irPara(p: number): void {
    this.pagina.set(Math.min(Math.max(1, p), this.totalPaginas()));
  }

  /* ================== Internos ================== */
  private carregarUfs(regiao: string | null): void {
    this.loadingUfs.set(true);
    const req = regiao ? this.api.ufsPorRegiao(regiao) : this.api.ufs();
    req
      .pipe(finalize(() => this.loadingUfs.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => this.ufs.set(r),
        error: (e) => this.falha('Não foi possível carregar as UFs.', e),
      });
  }

  /** Carrega municípios + contagem de meso/microrregiões da UF em paralelo. */
  private carregarUf(sigla: string): void {
    this.loadingMun.set(true);
    forkJoin({
      municipios: this.api.municipiosPorUf(sigla),
      mesos: this.api.mesosPorUf(sigla),
      micros: this.api.microsPorUf(sigla),
    })
      .pipe(finalize(() => this.loadingMun.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ municipios, mesos, micros }) => {
          this.municipios.set(municipios);
          this.qtdMeso.set(mesos.length);
          this.qtdMicro.set(micros.length);
        },
        error: (e) => this.falha('Não foi possível carregar os dados da UF.', e),
      });
  }

  private carregarMunicipio(codigo: string): void {
    this.limparMunicipio(false);
    this.loadingDetalhe.set(true);
    forkJoin({
      detalhe: this.api.municipioPorCodigo(codigo),
      distritos: this.api.distritosPorMunicipio(codigo),
    })
      .pipe(finalize(() => this.loadingDetalhe.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ detalhe, distritos }) => {
          this.detalhe.set(detalhe);
          this.distritos.set(distritos);
        },
        error: (e) => this.falha('Não foi possível carregar o município.', e),
      });
  }

  private limparUf(): void {
    this.ufSel.set(null);
    this.municipios.set([]);
    this.qtdMeso.set(0);
    this.qtdMicro.set(0);
    this.limparMunicipio();
  }

  private limparMunicipio(resetSel = true): void {
    if (resetSel) this.municipioSel.set(null);
    this.detalhe.set(null);
    this.distritos.set([]);
    this.subdistritos.set({});
    this.distritoAberto.set(null);
    this.erro.set(null);
  }

  private falha(msg: string, e: unknown): void {
    console.error(msg, e);
    this.erro.set(msg);
  }

}
