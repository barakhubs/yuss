<?php

namespace App\Notifications;

use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewLoanApplication extends Notification
{
    use Queueable;

    public $loan;

    /**
     * Create a new notification instance.
     */
    public function __construct(Loan $loan)
    {
        $this->loan = $loan;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Loan Application - ' . $this->loan->loan_number)
            ->line('A new loan application has been submitted and requires your review.')
            ->line('**Applicant:** ' . $this->loan->user->name)
            ->line('**Loan Number:** ' . $this->loan->loan_number)
            ->line('**Amount:** €' . number_format((float)$this->loan->amount, 2))
            ->line('**Purpose:** ' . $this->loan->purpose)
            ->line('**Repayment Period:** ' . $this->loan->repayment_period_months . ' month' . ($this->loan->repayment_period_months > 1 ? 's' : ''))
            ->line('**Payment before:** ' . \Carbon\Carbon::parse($this->loan->expected_repayment_date)->format('F j, Y \\a\\t g:i A'))
            ->action('Review Application', url('/sacco/loans/' . $this->loan->id))
            ->line('Please review and approve or reject this loan application.')
            ->line('Thank you!');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'loan_id' => $this->loan->id,
            'loan_number' => $this->loan->loan_number,
            'applicant_name' => $this->loan->user->name,
            'amount' => $this->loan->amount,
            'purpose' => $this->loan->purpose,
        ];
    }
}
