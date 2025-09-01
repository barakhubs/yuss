<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserCredentials extends Notification
{
    use Queueable;

    protected $password;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $password)
    {
        $this->password = $password;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
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
            ->subject('Your SACCO Account Has Been Created')
            ->greeting("Hello {$notifiable->name}!")
            ->line('An administrator has created a SACCO account for you.')
            ->line('You can now log in using the following credentials:')
            ->line("**Email:** {$notifiable->email}")
            ->line("**Password:** {$this->password}")
            ->line('For security purposes, please change your password after your first login.')
            ->action('Login to SACCO', route('login'))
            ->line('If you have any questions, please contact your SACCO administrator.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
