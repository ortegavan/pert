import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
    AbstractControl,
    ValidationErrors,
} from '@angular/forms';
import {
    PertInput,
    PertResult,
    PertHistoryEntry,
    Unidade,
    calculate,
    horasParaDias,
} from './pert.service';

@Component({
    selector: 'app-pert-calculator',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './pert-calculator.component.html',
    styleUrls: ['./pert-calculator.component.css'],
})
export class PertCalculatorComponent implements OnInit {
    pertForm!: FormGroup;
    result = signal<PertResult | null>(null);
    isLoading = signal(false);
    toastMessage = signal('');
    showToast = signal(false);
    history = signal<PertHistoryEntry[]>([]);
    showAdvanced = signal(false);
    showHowItWorks = signal(false);
    title = 'Calculadora 3 pontos / PERT / P90';

    constructor(private fb: FormBuilder) {}

    ngOnInit() {
        this.initializeForm();
        this.loadHistory();
    }

    private initializeForm() {
        this.pertForm = this.fb.group(
            {
                O: ['', [Validators.required, Validators.min(0.01)]],
                M: ['', [Validators.required, Validators.min(0.01)]],
                P: ['', [Validators.required, Validators.min(0.01)]],
                unidade: ['horas'],
                percentilSelecionado: [90], // P90 marcado por padrão
                lambda: [4, [Validators.required, Validators.min(1)]],
            },
            { validators: this.pertValidator },
        );
    }

    private pertValidator(control: AbstractControl): ValidationErrors | null {
        const O = control.get('O')?.value;
        const M = control.get('M')?.value;
        const P = control.get('P')?.value;

        if (O && M && P && (O > M || M > P)) {
            return { pertRule: true };
        }
        return null;
    }

    onSubmit() {
        if (this.pertForm.valid) {
            this.isLoading.set(true);

            // Simular skeleton/loader
            setTimeout(() => {
                const formValue = this.pertForm.value;
                const input: PertInput = {
                    O: Number(formValue.O),
                    M: Number(formValue.M),
                    P: Number(formValue.P),
                    unidade: formValue.unidade,
                    lambda: formValue.lambda,
                    percentis: [formValue.percentilSelecionado],
                };

                const calculatedResult = calculate(input);
                this.result.set(calculatedResult);
                this.isLoading.set(false);
            }, 300);
        }
    }

    onClear() {
        this.pertForm.reset({
            unidade: 'horas',
            percentilSelecionado: 90,
            lambda: 4,
        });
        this.result.set(null);
    }

    onCopyResults() {
        if (!this.result()) return;

        const result = this.result()!;
        const formValue = this.pertForm.value;
        const unidade = formValue.unidade;

        let text = `Resultados PERT & P90\n\n`;
        text += `Entradas: O=${formValue.O}, M=${formValue.M}, P=${formValue.P} ${unidade}\n`;
        text += `Média PERT: ${result.media} ${unidade}\n`;
        text += `Desvio (σ): ${result.sigma} ${unidade}\n\n`;
        text += `Percentis:\n`;

        Object.entries(result.valores).forEach(([key, value]) => {
            if (value !== undefined) {
                text += `${key}: ${value} ${unidade}\n`;
            }
        });

        const json = JSON.stringify(
            {
                input: formValue,
                result: result,
                timestamp: new Date().toISOString(),
            },
            null,
            2,
        );

        const clipboardText = `${text}\n\nJSON:\n${json}`;

        navigator.clipboard
            .writeText(clipboardText)
            .then(() => {
                this.showToastMessage('Resultados copiados para a área de transferência!');
            })
            .catch(() => {
                this.showToastMessage('Erro ao copiar resultados');
            });
    }

    onSaveEntry() {
        if (!this.result() || !this.pertForm.valid) return;

        const formValue = this.pertForm.value;
        const result = this.result()!;

        const entry: PertHistoryEntry = {
            O: Number(formValue.O),
            M: Number(formValue.M),
            P: Number(formValue.P),
            unidade: formValue.unidade,
            lambda: formValue.lambda,
            media: result.media,
            sigma: result.sigma,
            P90: result.valores.P90 || 0,
            createdAt: new Date().toISOString(),
        };

        const currentHistory = this.history();
        currentHistory.unshift(entry);
        this.history.set(currentHistory);
        this.saveHistory();
        this.showToastMessage('Entrada salva no histórico!');
    }

    onReapplyEntry(entry: PertHistoryEntry) {
        this.pertForm.patchValue({
            O: entry.O,
            M: entry.M,
            P: entry.P,
            unidade: entry.unidade,
            lambda: entry.lambda,
            percentilSelecionado: 90, // Reset para P90
        });

        // Recalcular automaticamente
        this.onSubmit();
        this.showToastMessage('Valores reaplicados!');
    }

    onDeleteEntry(index: number) {
        const currentHistory = this.history();
        currentHistory.splice(index, 1);
        this.history.set(currentHistory);
        this.saveHistory();
        this.showToastMessage('Entrada removida do histórico!');
    }

    private loadHistory() {
        const saved = localStorage.getItem('pertHistory');
        if (saved) {
            try {
                const history = JSON.parse(saved);
                this.history.set(history);
            } catch (error) {
                console.error('Erro ao carregar histórico:', error);
            }
        }
    }

    private saveHistory() {
        localStorage.setItem('pertHistory', JSON.stringify(this.history()));
    }

    private showToastMessage(message: string) {
        this.toastMessage.set(message);
        this.showToast.set(true);

        setTimeout(() => {
            this.showToast.set(false);
        }, 3000);
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleString('pt-BR');
    }

    getFormattedResult(unidade: Unidade, value: number): string {
        if (unidade === 'dias') {
            return `${horasParaDias(value)} dias`;
        }
        return `${value} horas`;
    }

    getErrorMessage(): string {
        const errors = this.pertForm.errors;
        if (errors?.['pertRule']) {
            return 'A regra é O ≤ M ≤ P.';
        }
        return '';
    }

    getFieldError(fieldName: string): string {
        const field = this.pertForm.get(fieldName);
        if (field?.errors?.['required']) {
            return 'Campo obrigatório.';
        }
        if (field?.errors?.['min']) {
            return 'Use valores numéricos positivos.';
        }
        return '';
    }

    isFormValid(): boolean {
        return this.pertForm.valid;
    }

    getPercentis(): (80 | 85 | 90 | 95)[] {
        return [80, 85, 90, 95];
    }

    getResultEntries(): [string, number | undefined][] {
        if (!this.result()) return [];
        return Object.entries(this.result()!.valores) as [string, number | undefined][];
    }
}
