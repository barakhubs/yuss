<?php

namespace App\Notifications;

use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoanStatusChanged extends Notification
{
    use Queueable;

    public $loan;
    public $status;
    public $notes;

    /**
     * Create a new notification instance.
     */
    public function __construct(Loan $loan, string $status, ?string $notes = null)
    {
        $this->loan = $loan;
        $this->status = $status;
        $this->notes = $notes;
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
        $message = new MailMessage();

        switch ($this->status) {
            case 'approved':
                $message->subject('Loan Application Approved - ' . $this->loan->loan_number)
                    ->greeting('Good news!')
                    ->line('Your loan application has been approved!')
                    ->line('**Loan Number:** ' . $this->loan->loan_number)
                    ->line('**Amount:** €' . number_format((float)$this->loan->amount, 2))
                    ->line('**Total Amount (with interest):** €' . number_format((float)$this->loan->total_amount, 2))
                    ->line('**Payment to be done before:** ' . \Carbon\Carbon::parse($this->loan->expected_repayment_date)->format('F j, Y \\a\\t g:i A'))
                    ->line('Your loan is now ready for disbursement. You will receive another notification when the funds are disbursed.');
                break;

            case 'rejected':
                $message->subject('Loan Application Update - ' . $this->loan->loan_number)
                    ->greeting('Loan Application Update')
                    ->line('We regret to inform you that your loan application has not been approved at this time.')
                    ->line('**Loan Number:** ' . $this->loan->loan_number)
                    ->line('**Amount Requested:** €' . number_format((float)$this->loan->amount, 2));

                if ($this->notes) {
                    $message->line('**Reason:** ' . $this->notes);
                }

                $message->line('You may apply for a new loan at any time if your circumstances change.');
                break;

            case 'disbursed':
                $message->subject('Loan Disbursed - ' . $this->loan->loan_number)
                    ->greeting('Loan Disbursed Successfully!')
                    ->line('Your approved loan has been disbursed!')
                    ->line('**Loan Number:** ' . $this->loan->loan_number)
                    ->line('**Amount Disbursed:** €' . number_format((float)$this->loan->amount, 2))
                    ->line('**Total Amount to Repay:** €' . number_format((float)$this->loan->total_amount, 2))
                    ->line('**Expected Repayment Date:** ' . $this->loan->expected_repayment_date)
                    ->line('Please ensure to make your repayment by the expected date to avoid any complications.');
                break;

            default:
                $message->subject('Loan Status Update - ' . $this->loan->loan_number)
                    ->line('Your loan status has been updated to: ' . ucfirst($this->status))
                    ->line('**Loan Number:** ' . $this->loan->loan_number)
                    ->line('**Amount:** €' . number_format((float)$this->loan->amount, 2));
                break;
        }

        // Add admin notes if provided
        if ($this->notes && $this->status !== 'rejected') {
            $message->line('**Notes:** ' . $this->notes);
        }

        $message->action('View Loan Details', url('/sacco/loans/' . $this->loan->id))
            ->line('Thank you for using our SACCO services!');

        return $message;
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'loan_id' => $this->loan->id,
            'loan_number' => $this->loan->loan_number,
            'status' => $this->status,
            'amount' => $this->loan->amount,
            'notes' => $this->notes,
        ];
    }
}
